import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ScanSearch,
  ShieldCheck,
  Workflow,
  Check,
  ArrowRight,
  Lock,
  Receipt,
  Zap,
  Trophy,
  Target,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Terminal,
  Cpu,
  Activity,
  Eye,
  Wifi,
  Database,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LiveTicker } from "@/components/site/LiveTicker";
import { FloatingParticles } from "@/components/site/FloatingParticles";

import { GlitchText } from "@/components/site/GlitchText";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { LogoSymbol } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const symbolLogo = "/virtu-iq-symbol.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Virtu-IQ — Instant Virtuals Outcome Exposed" },
      {
        name: "description",
        content:
          "Virtu-IQ exposes the next SportyBet instant virtual outcome before the game loads. Upload your screenshot, hack the result, play with certainty.",
      },
      { property: "og:title", content: "Virtu-IQ — Instant Virtuals Outcome Exposed" },
      {
        property: "og:description",
        content:
          "Our algorithm penetrates the SportyBet instant virtual engine and delivers the next outcome — no guesswork, just exposed results.",
      },
    ],
    links: [{ rel: "canonical", href: "https://virtu-iq.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Virtu-IQ packages",
          itemListElement: [
            {
              name: "Starter",
              description: "2 scan credits, 2 outcomes per screenshot.",
              price: "250",
            },
            {
              name: "Plus",
              description: "3 scan credits, 4 outcomes per screenshot.",
              price: "350",
            },
            {
              name: "Premium",
              description: "5 scan credits, 8 outcomes per screenshot.",
              price: "500",
            },
          ].map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: `Virtu-IQ ${p.name}`,
              description: p.description,
              brand: { "@type": "Brand", name: "Virtu-IQ" },
              offers: {
                "@type": "Offer",
                price: p.price,
                priceCurrency: "GHS",
                availability: "https://schema.org/InStock",
                url: "https://virtu-iq.lovable.app/#packages",
              },
            },
          })),
        }),
      },
    ],
  }),
  component: Index,
});

const features = [

  {
    icon: Cpu,
    title: "Algorithm Precision",
    body: "Our proprietary breach engine decodes each virtual match frame with machine-level accuracy. Results are locked — zero second-guessing.",
  },
  {
    icon: Trophy,
    title: "Proven Strikes",
    body: "Thousands of users have already exposed outcomes daily. Numbers don't lie — our track record proves it.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Traces",
    body: "All breach operations are encrypted end-to-end. Your account, uploads, and exposed outcomes leave no trail.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    body: "Upload your screenshot. Our system penetrates the virtual feed and returns the exposed outcome in seconds.",
  },
];

const steps = [
  {
    n: "01",
    title: "Upload",
    body: "Drop your SportyBet instant virtual screenshot — PNG, JPG or WEBP. Our system reads the game identifier.",
  },
  {
    n: "02",
    title: "Penetrate",
    body: "The algorithm breaches the virtual engine feed, cross-references the match ID, and locks the next outcome.",
  },
  {
    n: "03",
    title: "Expose",
    body: "Receive your certified outcome — confirmed before the game loads. Bet with certainty, not chance.",
  },
];

const packages = [
  {
    name: "Starter",
    price: "GH₵250",
    credits: "2 outcomes per screenshot",
    perks: ["2 scan credits", "Instant Virtual Football only", "Outcome history", "Email support"],
    popular: false,
    badge: null,
  },
  {
    name: "Plus",
    price: "GH₵350",
    credits: "4 outcomes per screenshot",
    perks: ["3 scan credits", "Instant Virtual Football only", "Outcome history", "Priority email support"],
    popular: false,
    badge: "🔥 Best Value",
  },
  {
    name: "Premium",
    price: "GH₵500",
    credits: "8 outcomes per screenshot",
    perks: ["5 scan credits", "Instant Virtual Football only", "Outcome history", "Priority support"],
    popular: true,
    badge: "⚡ Most Popular",
  },
];

const trust = [
  { icon: Lock, title: "Fully encrypted", body: "Every breach operation runs over 256-bit encrypted tunnels. Nothing leaks." },
  { icon: ShieldCheck, title: "Verified outcomes", body: "Every exposed result passes through our multi-layer verification engine." },
  { icon: TrendingUp, title: "Consistent delivery", body: "Tens of thousands of outcomes delivered with zero downtime." },
  { icon: Receipt, title: "Transparent pricing", body: "Clear credit packages, visible history — no hidden fees, ever." },
];

const faqs = [
  {
    q: "How does the outcome exposure system work?",
    a: "You upload a SportyBet instant virtual screenshot. Virtu-IQ's algorithm reads the game ID, penetrates the virtual engine's outcome feed, and delivers the result before the match is rendered.",
  },
  {
    q: "Which image formats are supported?",
    a: "PNG, JPG, JPEG and WEBP screenshots. Clear, high-resolution images produce the most accurate outcome exposures.",
  },
  {
    q: "What are scan credits?",
    a: "Each package includes scan credits. One credit processes one screenshot and delivers your exposed instant virtual outcome. Credits are consumed per scan.",
  },
  {
    q: "Is my account secure?",
    a: "Accounts use managed authentication with enterprise-grade access controls. Your profile, payments, outcomes and notifications are only visible to you.",
  },
  {
    q: "How is payment verified?",
    a: "Submit your payment with its reference. It is recorded as pending, reviewed by an administrator, and credits are added only once the payment is approved.",
  },
  {
    q: "Can I review past exposed outcomes?",
    a: "Yes. Every completed exposure is saved to your history with its ID, date, image and status — and can be reopened or downloaded at any time.",
  },
];

/* ── Logo Watermark Background ── */
function LogoWatermark() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.025]" aria-hidden="true">
      <div className="absolute inset-0 animate-logo-drift" style={{ transformOrigin: "center center" }}>
        {Array.from({ length: 35 }, (_, i) => (
          <img
            key={i}
            src={symbolLogo}
            alt=""
            className="absolute h-16 w-16 select-none"
            style={{
              left: `${(i * 19 + 5) % 95}%`,
              top: `${(i * 23 + 8) % 90}%`,
              transform: `rotate(${(i * 37) % 360}deg)`,
              animationDelay: `${(i * 0.3) % 4}s`,
              filter: "hue-rotate(120deg) brightness(2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Terminal Hack Card ── */
function TerminalHackCard() {
  const outcomes = [
    { game: "SPBET-VIRT #3291", match: "Lions FC vs Eagles Utd", result: "HOME WIN", odds: "1.85", status: "EXPOSED" },
    { game: "SPBET-VIRT #3292", match: "Storm City vs Thunder FC", result: "OVER 2.5 GOALS", odds: "1.72", status: "EXPOSED" },
    { game: "SPBET-VIRT #3293", match: "Phoenix FC vs Red Devils", result: "BTTS — YES", odds: "1.90", status: "EXPOSED" },
  ];

  return (
    <div
      className="rounded-xl p-3 sm:p-6 relative overflow-hidden font-mono bg-slate-950 border border-emerald-500/40 shadow-2xl text-slate-100"
    >
      {/* Scan line */}
      <div className="animate-scan-line" />

      {/* Shine sweep */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 w-[30%] animate-shine"
          style={{ background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.08), transparent)" }}
        />
      </div>

      {/* Terminal header bar */}
      <div className="flex items-center gap-1.5 mb-3 sm:mb-4 pb-3 border-b border-slate-800 min-w-0">
        <span className="size-2.5 shrink-0 rounded-full bg-red-500" />
        <span className="size-2.5 shrink-0 rounded-full bg-yellow-500" />
        <span className="size-2.5 shrink-0 rounded-full bg-emerald-500" />
        <span className="ml-2 text-[9px] sm:text-[10px] tracking-wider truncate flex-1 min-w-0 text-emerald-400">
          root@virtu-iq:~$ ./breach_sportybet.sh
        </span>
        <span className="shrink-0 inline-block w-1.5 h-3 bg-emerald-400 animate-terminal-cursor" />
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3 sm:mb-4 relative">
        <div className="flex items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500 animate-status-blink" />
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-emerald-400">
            BREACH ACTIVE
          </span>
        </div>
        <Badge className="text-[9px] sm:text-[10px] gap-1 font-mono bg-red-500/15 border-red-500/40 text-red-400 shrink-0">
          <AlertTriangle className="size-3" />
          3 OUTCOMES EXPOSED
        </Badge>
      </div>

      {/* Outcome rows */}
      <div className="space-y-2 sm:space-y-3 relative">
        {outcomes.map((v, i) => (
          <div
            key={v.game}
            className="rounded-lg p-2.5 sm:p-3 transition-all bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50"
            style={{
              animation: `slide-up-fade 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + i * 0.15}s both`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] tracking-wider truncate text-slate-400">
                  {v.game} · {v.match}
                </p>
                <p className="mt-0.5 text-xs sm:text-sm font-bold text-white">
                  {v.result}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                  <Check className="size-2.5" />
                  {v.status}
                </span>
                <p className="mt-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400">
                  @{v.odds}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="mt-3 sm:mt-4 rounded-lg p-2.5 sm:p-3 border bg-red-950/20 border-red-500/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-red-400">
            <Cpu className="size-3.5 shrink-0" />
            <span className="truncate">SYSTEM ACCESS: GRANTED</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold shrink-0 text-emerald-400">
            ✓ EXPOSED
          </span>
        </div>
        <div className="mt-2 h-1 sm:h-1.5 overflow-hidden rounded-full bg-red-950/50">
          <div
            className="h-full rounded-full animate-hack-bar bg-gradient-to-r from-red-500 to-emerald-400"
          />
        </div>
        <p className="mt-1.5 text-[9px] sm:text-[10px] text-slate-400">
          Next breach cycle: <span className="text-emerald-400">00:03:47</span>
        </p>
      </div>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background text-foreground">
      {/* Global logo watermark */}
      <LogoWatermark />

      <SiteNavbar />
      <LiveTicker />

      <main className="relative">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden border-b border-border/60 bg-white">


          {/* Red radial ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(60% 60% at 75% 0%, rgba(228, 24, 39, 0.08), transparent 70%)",
            }}
          />
          {/* Green radial ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(40% 40% at 5% 100%, rgba(16, 185, 129, 0.08), transparent 70%)",
            }}
          />

          <FloatingParticles />

          <div className="relative mx-auto grid max-w-6xl items-center gap-8 sm:gap-12 px-4 py-10 sm:py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            {/* Left column */}
            <div className="animate-rise relative">
              {/* Breach badge */}
              <div className="mb-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 font-mono text-xs font-bold tracking-widest text-primary shadow-sm">
                  <span className="size-2 rounded-full bg-primary animate-status-blink" />
                  SYSTEM BREACH ACTIVE
                </span>
              </div>

              {/* Main headline with glitch */}
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-6xl leading-tight text-slate-950">
                Instant Virtuals.{" "}
                <GlitchText className="text-primary">
                  Outcome Exposed.
                </GlitchText>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg text-slate-700 font-medium">
                Our proprietary algorithm penetrates the{" "}
                <span className="font-bold text-emerald-700">
                  SportyBet instant virtual engine
                </span>{" "}
                — delivering the next match outcome before the game even loads. No guesswork. Just exposed results.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="relative overflow-hidden group font-mono font-bold tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
                  asChild
                >
                  <Link to="/register">
                    <span className="relative z-10 flex items-center gap-2">
                      HACK THE OUTCOME{" "}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="font-mono border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold"
                >
                  <a href="#how-it-works">
                    <Terminal className="mr-2 size-4 text-emerald-600" />
                    ENTER THE SYSTEM
                  </a>
                </Button>
              </div>

              {/* Animated stats */}
              <dl className="mt-6 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-6 border-t border-slate-200 pt-6">
                <div>
                  <dt className="text-xl sm:text-2xl font-extrabold font-mono text-slate-950">
                    <AnimatedCounter end={99} suffix="%" className="tabular-nums" />
                  </dt>
                  <dd className="text-[11px] sm:text-xs font-mono font-semibold text-slate-600 mt-0.5">Accuracy rate</dd>
                </div>
                <div>
                  <dt className="text-xl sm:text-2xl font-extrabold font-mono text-slate-950">
                    <AnimatedCounter end={14} suffix="K+" className="tabular-nums" />
                  </dt>
                  <dd className="text-[11px] sm:text-xs font-mono font-semibold text-slate-600 mt-0.5">Exposed</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xl sm:text-2xl font-extrabold font-mono text-slate-950">
                    <span className="size-2.5 shrink-0 rounded-full bg-emerald-600 animate-status-blink" />
                    24/7
                  </dt>
                  <dd className="text-[11px] sm:text-xs font-mono font-semibold text-slate-600 mt-0.5">Always live</dd>
                </div>
              </dl>
            </div>

            {/* Right column — terminal card */}
            <div className="animate-rise">
              <TerminalHackCard />
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24 relative">

          <div className="max-w-2xl relative">
            <span className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest text-primary">
              <Activity className="size-3.5" />
              WHY OUR ALGORITHM NEVER FAILS
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-slate-950">
              Built to Expose, Not Guess
            </h2>
            <p className="mt-3 text-slate-600 font-medium">
              Every component is engineered to deliver certainty — not predictions.
            </p>
          </div>
          <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl p-5 sm:p-6 transition-all hover:-translate-y-1 cursor-default bg-white border border-slate-200/80 shadow-md hover:shadow-xl hover:border-primary/40"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold font-mono text-slate-950">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="border-y border-slate-200 relative bg-slate-50/80">
          <FloatingParticles />

          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16 sm:px-6 lg:py-24 relative">
            <div className="max-w-2xl">
              <span className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest text-emerald-700">
                <Wifi className="size-3.5" />
                BREACH PROTOCOL
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-slate-950">
                How The System Works
              </h2>
              <p className="mt-3 text-slate-600 font-medium">
                Three steps from screenshot to exposed instant virtual outcome.
              </p>
            </div>
            <ol className="mt-8 sm:mt-10 grid gap-4 sm:gap-5 sm:grid-cols-3">
              {steps.map((s, idx) => (
                <li
                  key={s.n}
                  className="group rounded-xl p-5 sm:p-6 transition-all bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-500/50"
                >
                  <span
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-full text-sm font-extrabold tracking-widest font-mono transition-colors",
                      idx === 1
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-lg font-bold font-mono text-slate-950">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>



        {/* ── TRUST ── */}
        <section className="relative bg-white border-y border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20 sm:px-6">
            {/* Section header */}
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <span className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest text-primary">
                <Database className="size-3.5" />
                OPERATIONAL INTEGRITY
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-slate-950">
                Built on Trust, Hardened by Design
              </h2>
              <p className="mt-3 text-slate-600 font-medium text-sm sm:text-base">
                Every layer of Virtu-IQ is engineered for security, reliability, and transparency.
              </p>
            </div>

            {/* Trust cards grid */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trust.map((t, idx) => {
                const accents = [
                  { border: "border-t-red-500", iconBg: "bg-red-50 group-hover:bg-red-100", iconText: "text-red-600" },
                  { border: "border-t-emerald-500", iconBg: "bg-emerald-50 group-hover:bg-emerald-100", iconText: "text-emerald-600" },
                  { border: "border-t-blue-500", iconBg: "bg-blue-50 group-hover:bg-blue-100", iconText: "text-blue-600" },
                  { border: "border-t-amber-500", iconBg: "bg-amber-50 group-hover:bg-amber-100", iconText: "text-amber-600" },
                ];
                const accent = accents[idx % accents.length] ?? {
                  border: "border-t-emerald-500",
                  iconBg: "bg-emerald-50 group-hover:bg-emerald-100",
                  iconText: "text-emerald-600",
                };
                return (
                  <div
                    key={t.title}
                    className={cn(
                      "group relative rounded-xl border border-slate-200/80 border-t-[3px] bg-white p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default",
                      accent.border
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-11 items-center justify-center rounded-lg transition-colors duration-300",
                        accent.iconBg,
                        accent.iconText
                      )}
                    >
                      <t.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-sm font-bold font-mono text-slate-950">
                      {t.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
                      {t.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-3xl px-4 py-10 sm:py-16 sm:px-6 lg:py-24">
          <span className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest text-emerald-700">
            <Eye className="size-3.5" />
            FREQUENTLY ASKED
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-slate-950">
            Questions &amp; Intel
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((f) => (
              <AccordionItem
                key={f.q}
                value={f.q}
                className="border-slate-200"
              >
                <AccordionTrigger className="text-left text-base font-bold font-mono text-slate-900 hover:text-primary">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-slate-600 font-medium">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="border-t border-primary/30 relative overflow-hidden bg-gradient-to-r from-red-600 via-primary to-red-700 text-white">

          <FloatingParticles />
          <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center sm:px-6 relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 font-mono text-[10px] sm:text-xs font-bold tracking-widest text-white">
              <span className="size-2 shrink-0 rounded-full bg-emerald-400 animate-status-blink" />
              <span>SYSTEM ONLINE — READY TO BREACH</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl text-white">
              Ready to Expose Your First Instant Virtual?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-white/90 font-medium">
              Create your Virtu-IQ account and start receiving exposed instant virtual outcomes in minutes.
            </p>
            <Button
              size="lg"
              className="mt-6 sm:mt-8 group font-mono font-bold tracking-widest bg-white text-primary hover:bg-slate-100 shadow-xl"
              asChild
            >
              <Link to="/register">
                HACK THE OUTCOME{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
