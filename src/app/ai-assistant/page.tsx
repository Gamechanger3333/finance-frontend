"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { getToken } from "@/hooks/use-auth";
import { Bot, Send, Loader2, Sparkles, TrendingUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

const BG = "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1400&q=80";
interface Message { role: "user" | "assistant"; content: string; }
const QUICK = ["What are my biggest expenses?", "How can I improve my savings rate?", "Am I on track with my goals?", "Suggest ways to cut my monthly spending"];

export default function AiAssistantPage() {
  const { data: insights, isLoading: loadingInsights, refetch } = useQuery({ queryKey: ["ai-insights"], queryFn: () => apiGet("/api/ai/insights") });
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Hi! I'm your FinFlow AI advisor powered by Llama 3.3. I can see your financial data and give you personalized advice. What would you like to know?" }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState(QUICK);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const token = getToken();
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "Sorry, I didn't get a response. Please try again." }]);
      if (data.suggestions?.length) setSuggestions(data.suggestions);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I had trouble processing your request. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const insightTypes: Record<string, { color: string; emoji: string }> = {
    warning: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", emoji: "⚠️" },
    opportunity: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", emoji: "💡" },
    tip: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", emoji: "💬" },
    achievement: { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", emoji: "🏆" },
  };

  return (
    <ProtectedLayout>
      <div className="min-h-full flex flex-col">
        <div className="relative h-40 overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-background" />
          <div className="relative z-10 px-6 pt-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Financial Advisor</h1>
                <p className="text-foreground/60 text-xs mt-0.5">Powered by Llama 3.3 · Groq</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pb-4 -mt-2 grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="flex flex-col bg-card/70 border border-border rounded-xl overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[500px]">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  )}
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user" ? "bg-emerald-500/20 text-foreground ml-auto rounded-br-sm" : "bg-accent text-foreground/80 rounded-bl-sm")}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="bg-accent rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => <div key={d} className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-2 border-t border-border/70">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {suggestions.slice(0, 4).map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="flex-shrink-0 text-xs text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded-full px-3 py-1 hover:bg-emerald-500/15 transition-colors whitespace-nowrap">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything about your finances..."
                  className="flex-1 h-10 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 px-3 text-sm focus:outline-none"
                  disabled={sending} />
                <button type="submit" disabled={!input.trim() || sending}
                  className="h-10 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card/70 border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">AI Insights</span>
                </div>
                <button onClick={() => refetch()} className="text-muted-foreground/80 hover:text-foreground/60 transition-colors">
                  <RefreshCw className={cn("w-3.5 h-3.5", loadingInsights && "animate-spin")} />
                </button>
              </div>
              {loadingInsights ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-card/70 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {((insights as any)?.insights ?? []).slice(0, 4).map((ins: any, i: number) => {
                    const style = insightTypes[ins.type] ?? insightTypes.tip;
                    return (
                      <div key={i} className={cn("border rounded-lg p-3", style.color)}>
                        <div className="flex items-start gap-2">
                          <span className="text-base flex-shrink-0">{style.emoji}</span>
                          <div>
                            <p className="text-xs font-semibold">{ins.title}</p>
                            <p className="text-xs opacity-70 mt-0.5 leading-relaxed">{ins.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {(insights as any)?.recommendations?.length > 0 && (
              <div className="bg-card/70 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">Top Recommendations</span>
                </div>
                <ol className="space-y-2">
                  {((insights as any)?.recommendations ?? []).slice(0, 4).map((r: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-xs text-foreground/60">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
