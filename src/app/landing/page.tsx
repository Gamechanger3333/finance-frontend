import Link from "next/link";
import {
  TrendingUp, BarChart3, Shield, Bot, Target, Zap,
  ArrowRight, Check, ChevronRight, Star,
} from "lucide-react";
import LandingAssistant from "@/components/landing/LandingAssistant";
import ThemeToggle from "@/components/ui/theme-toggle";
import ScrollToTop from "@/components/ui/scroll-to-top";
import Reveal from "@/components/ui/reveal";

const STATS = [
  { label: "Active Users", value: "50K+" },
  { label: "Transactions Tracked", value: "$2B+" },
  { label: "Avg Savings Increase", value: "34%" },
  { label: "Satisfaction Rate", value: "98%" },
];

const FEATURES = [
  { icon: BarChart3, title: "Smart Analytics", desc: "Real-time dashboards with deep spending insights and trend analysis across all your accounts." },
  { icon: Bot, title: "AI Financial Advisor", desc: "Powered by Llama 3.3 — get personalized advice, budget recommendations, and savings tips instantly." },
  { icon: Target, title: "Goal Tracking", desc: "Set savings goals and watch your progress with intelligent milestone tracking and projections." },
  { icon: Shield, title: "Bank-Level Security", desc: "256-bit AES encryption with multi-factor authentication keeps your financial data safe." },
  { icon: Zap, title: "Instant Categorization", desc: "Transactions auto-categorized with 97% accuracy using machine learning algorithms." },
  { icon: TrendingUp, title: "Budget Management", desc: "Create flexible budgets, get overspend alerts, and optimize your monthly financial plan." },
];

const PLANS = [
  { name: "Free", price: "$0", period: "/mo", desc: "Perfect for getting started", cta: "Get Started", highlight: false, features: ["50 transactions/month", "3 budget categories", "Basic analytics", "AI chat (10/day)"] },
  { name: "Pro", price: "$9", period: "/mo", desc: "For serious money managers", cta: "Start Free Trial", highlight: true, features: ["Unlimited transactions", "Unlimited budgets", "Advanced analytics", "Unlimited AI insights", "Export reports", "Priority support"] },
  { name: "Business", price: "$29", period: "/mo", desc: "For teams & businesses", cta: "Contact Sales", highlight: false, features: ["Everything in Pro", "Team collaboration", "Accountant access", "API access", "Custom categories", "Dedicated support"] },
];

const TESTIMONIALS = [
  { name: "Sarah Chen", role: "Software Engineer", text: "FinFlow's AI advisor helped me save an extra $800/month. The spending insights are incredibly detailed.", rating: 5 },
  { name: "Marcus Williams", role: "Freelance Designer", text: "Finally a budgeting app that understands irregular income. The goal tracking keeps me motivated.", rating: 5 },
  { name: "Priya Sharma", role: "Product Manager", text: "Switched from Mint and never looked back. The AI chat is a game-changer for financial planning.", rating: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">FinFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-foreground/60">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-foreground/70 hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">Sign in</Link>
            <Link href="/register" className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />AI-Powered Finance Management
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Take control of your{" "}
              <span className="text-emerald-400">financial future</span>
            </h1>
            <p className="text-lg text-foreground/60 leading-relaxed mb-8 max-w-lg">
              FinFlow combines smart budgeting, real-time analytics, and an AI advisor powered by Llama 3.3 to help you reach your financial goals faster.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="inline-flex items-center bg-emerald-500 hover:bg-emerald-400 hover:-translate-y-0.5 text-white px-8 py-3 rounded-xl font-semibold text-base transition-all">
                Start for free <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center border border-border text-foreground hover:bg-card/70 hover:-translate-y-0.5 px-8 py-3 rounded-xl font-semibold text-base transition-all">
                Try demo account
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground/80">No credit card required · Free plan available</p>
          </div>

          <div className="relative animate-fade-in-up stagger-2">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-3xl scale-95 animate-float" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80" alt="FinFlow dashboard" className="w-full h-80 object-cover" />
              <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This month&apos;s savings</p>
                  <p className="text-lg font-bold text-emerald-400">+$1,240.50</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground">vs last month</p>
                  <p className="text-sm font-semibold text-emerald-400">↑ 23.4%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border/70 bg-card/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything you need to master your finances</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">From AI-powered insights to automated budgeting, FinFlow has all the tools you need.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delayMs={(i % 3) * 80}>
                <div className="bg-card/70 border border-border rounded-xl p-6 hover:border-emerald-500/30 hover:bg-accent hover:-translate-y-1 transition-all duration-200 group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <f.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you need more power.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delayMs={i * 100}>
                <div className={`rounded-xl p-6 border relative hover:-translate-y-1 transition-transform duration-200 ${plan.highlight ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-card/50"}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                    </div>
                  )}
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground/60">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`block text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${plan.highlight ? "bg-emerald-500 hover:bg-emerald-400 text-white" : "bg-card/70 hover:bg-accent text-foreground border border-border"}`}>
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 border-t border-border/70">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Loved by thousands</h2>
            <p className="text-muted-foreground text-lg">Here&apos;s what our users say about FinFlow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delayMs={i * 100}>
                <div className="bg-card/70 border border-border rounded-xl p-6 hover:-translate-y-1 transition-transform duration-200">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>
                  <p className="text-foreground/70 text-sm leading-relaxed mb-4">&quot;{t.text}&quot;</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <Reveal className="max-w-3xl mx-auto text-center" as="div">
          <h2 className="text-4xl font-bold mb-4">Start your financial journey today</h2>
          <p className="text-muted-foreground text-lg mb-8">Join 50,000+ people who&apos;ve transformed their finances with FinFlow.</p>
          <Link href="/register" className="inline-flex items-center bg-emerald-500 hover:bg-emerald-400 hover:-translate-y-0.5 text-white px-10 py-3 rounded-xl font-semibold text-base transition-all">
            Create free account <ChevronRight className="ml-1 w-4 h-4" />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground/80">Or <Link href="/login" className="text-emerald-400 hover:underline">sign in</Link> to your existing account</p>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground/80">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-semibold text-foreground/60">FinFlow</span>
          </div>
          <p>© 2026 FinFlow. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground/60 transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      <LandingAssistant />
      <ScrollToTop />
    </div>
  );
}
