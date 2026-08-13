"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Zap, ArrowRight, X } from "lucide-react";

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=2400&q=85&auto=format&fit=crop",
    focal: "object-center",
    alt: "Colorful analytics chart displayed on a laptop screen",
    badge: "Real-Time Analytics",
    headline: "See your money,",
    accent: "clearly.",
    subtext: "Deep dashboards break down every transaction so you always know exactly where your money goes.",
  },
  {
    image: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=2400&q=85&auto=format&fit=crop",
    focal: "object-[center_25%]",
    alt: "Financial advisor reviewing portfolio data on a tablet",
    badge: "AI-Powered Advice",
    headline: "Take control of your",
    accent: "financial future.",
    subtext: "An AI advisor powered by Llama 3.3 gives personalized budget tips and savings recommendations, instantly.",
  },
  {
    image: "https://images.unsplash.com/photo-1671058560955-4e5dbdcd9aba?w=2400&q=85&auto=format&fit=crop",
    focal: "object-center",
    alt: "Stack of silver coins on a studio background, representing savings goals",
    badge: "Goal Tracking",
    headline: "Watch your goals",
    accent: "become real.",
    subtext: "Set savings targets and track progress with intelligent milestones and projections along the way.",
  },
  {
    image: "https://images.unsplash.com/photo-1769776400201-6b99211a4f4f?w=2400&q=85&auto=format&fit=crop",
    focal: "object-center",
    alt: "Piggy bank and calculator on a bright orange background",
    badge: "Budget Management",
    headline: "Build a budget",
    accent: "that actually works.",
    subtext: "Create flexible budgets, get overspend alerts, and stay on track with your monthly financial plan.",
  },
  {
    image: "https://images.unsplash.com/photo-1644088379091-d574269d422f?w=2400&q=85&auto=format&fit=crop",
    focal: "object-center",
    alt: "Abstract blue data security network",
    badge: "Bank-Level Security",
    headline: "Bank on",
    accent: "airtight security.",
    subtext: "256-bit AES encryption and multi-factor authentication keep every account and transaction locked down.",
  },
];

const STATS = [
  { label: "This month's savings", value: "+$1,240.50" },
  { label: "vs last month", value: "↑ 23.4%" },
];

const INTERVAL_MS = 5000;

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [badgeDismissed, setBadgeDismissed] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="relative h-[100svh] min-h-[600px] sm:h-[92vh] sm:min-h-[640px] w-full overflow-hidden">
      {/* Crossfading background images — HD, sharp source photos, no soft-focus/bokeh shots */}
      {SLIDES.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s.image}
          src={s.image}
          alt={s.alt}
          className={`absolute inset-0 w-full h-full object-cover ${s.focal} saturate-125 contrast-105 transition-opacity duration-[2200ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Gradient scrim for legibility — no solid panel behind the text, just enough darkening on the image itself */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />

      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-20 sm:pb-16">
        {/* key={index} remounts this block so animate-fade-in-up replays on every slide change.
            No panel background — legibility comes from the gradient scrim on the image plus text-shadow. */}
        <div key={index} className="animate-fade-in-up max-w-2xl" style={{ animationDuration: "900ms" }}>
          {!badgeDismissed && (
            <div className="relative inline-flex items-center gap-2 pl-0 pr-8 py-1.5 text-emerald-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Zap className="w-3.5 h-3.5" />
              {slide.badge}
              <button
                type="button"
                onClick={() => setBadgeDismissed(true)}
                aria-label="Dismiss"
                className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-emerald-400/80 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4 sm:mb-6 text-white [text-shadow:0_2px_20px_rgb(0_0_0_/_70%)]">
            <span key={`h-${index}`} className="inline-block animate-hero-line-fade">{slide.headline}</span>{" "}
            <span key={`a-${index}`} className="inline-block text-emerald-400 animate-hero-line-up" style={{ animationDelay: "550ms" }}>{slide.accent}</span>
          </h1>
          <p className="text-base sm:text-lg text-white/90 leading-relaxed mb-5 sm:mb-6 max-w-lg [text-shadow:0_1px_10px_rgb(0_0_0_/_70%)]">
            {slide.subtext}
          </p>

          {/* Compact stat strip — replaces the old floating card */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="text-white/60">{STATS[0].label}: </span>
              <span className="text-emerald-400 font-semibold">{STATS[0].value}</span>
              <span className="text-white/30 mx-2">·</span>
              <span className="text-white/60">{STATS[1].label} </span>
              <span className="text-emerald-400 font-semibold">{STATS[1].value}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link href="/register" className="inline-flex items-center bg-emerald-500 hover:bg-emerald-400 hover:-translate-y-0.5 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all">
              Start for free <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:-translate-y-0.5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all">
              Try demo account
            </Link>
          </div>
          <p className="mt-4 text-xs sm:text-sm text-white/70 [text-shadow:0_1px_6px_rgb(0_0_0_/_70%)]">No credit card required · Free plan available</p>
        </div>

        {/* Slide dots */}
        <div className="flex items-center gap-2 mt-6 sm:mt-8 px-1 flex-wrap">
          {SLIDES.map((s, i) => (
            <button
              key={s.image}
              type="button"
              aria-label={`Show slide ${i + 1}: ${s.badge}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-emerald-400" : "w-4 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}