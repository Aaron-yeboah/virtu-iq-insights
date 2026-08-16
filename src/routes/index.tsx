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
import { MatrixRain } from "@/components/site/MatrixRain";
import { GlitchText } from "@/components/site/GlitchText";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { LogoSymbol } from "@/components/brand/Logo";
import symbolLogo from "@/assets/virtu-iq-symbol.png";
import { cn } from "@/lib/utils";

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
              description: "50 scan credits, 2 outcomes per screenshot.",
              price: "250",
            },
            {
              name: "Plus",
              description: "100 scan credits, 4 outcomes per screenshot.",
              price: "350",
            },
            {
              name: "Premium",
              description: "200 scan credits, 8 outcomes per screenshot.",
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
    perks: ["50 scan credits", "Instant Virtual Football only", "Outcome history", "Email support"],
    popular: false,
    badge: null,
  },
  {
    name: "Plus",
    price: "GH₵350",
    credits: "4 outcomes per screenshot",
    perks: ["100 scan credits", "Instant Virtual Football only", "Outcome history", "Priority email support"],
    popular: false,
    badge: "🔥 Best Value",
  },
  {
    name: "Premium",
    price: "GH₵500",
    credits: "8 outcomes per screenshot",
    perks: ["200 scan credits", "Instant Virtual Football only", "Outcome history", "Priority support"],
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
      className="rounded-xl p-3 sm:p-6 relative overflow-hidden font-mono animate-border-bleed"
      style={{
        background: "oklch(0.08 0.005 27)",
        border: "1px solid oklch(0.53 0.22 27 / 0.4)",
        boxShadow: "0 0 30px oklch(0.53 0.22 27 / 0.12), 0 20px 60px oklch(0 0 0 / 0.6)",
      }}
    >
      {/* Scan line */}
      <div className="animate-scan-line" />

      {/* Shine sweep */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 w-[30%] animate-shine"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.53 0.22 27 / 0.04), transparent)" }}
        />
      </div>

      {/* Terminal header bar */}
      <div
        className="flex items-center gap-1.5 mb-3 sm:mb-4 pb-3 border-b min-w-0"
        style={{ borderColor: "oklch(0.18 0.012 27)" }}
      >
        <span className="size-2.5 shrink-0 rounded-full bg-red-500" />
        <span className="size-2.5 shrink-0 rounded-full bg-yellow-500" />
        <span className="size-2.5 shrink-0 rounded-full bg-green-500" />
        <span className="ml-2 text-[9px] sm:text-[10px] tracking-wider truncate flex-1 min-w-0" style={{ color: "oklch(0.72 0.22 142)" }}>
          root@virtu-iq:~$ ./breach_sportybet.sh
        </span>
        <span
          className="shrink-0 inline-block w-1.5 h-3 animate-terminal-cursor"
          style={{ background: "oklch(0.72 0.22 142)" }}
        />
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3 sm:mb-4 relative">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full animate-status-blink"
            style={{ background: "oklch(0.72 0.22 142)" }}
          />
          <span className="text-[10px] sm:text-xs font-bold tracking-widest" style={{ color: "oklch(0.72 0.22 142)" }}>
            BREACH ACTIVE
          </span>
        </div>
        <Badge
          className="text-[9px] sm:text-[10px] gap-1 font-mono border shrink-0"
          style={{
            background: "oklch(0.53 0.22 27 / 0.12)",
            borderColor: "oklch(0.53 0.22 27 / 0.35)",
            color: "oklch(0.53 0.22 27)",
          }}
        >
          <AlertTriangle className="size-3" />
          3 OUTCOMES EXPOSED
        </Badge>
      </div>

      {/* Outcome rows */}
      <div className="space-y-2 sm:space-y-3 relative">
        {outcomes.map((v, i) => (
          <div
            key={v.game}
            className="rounded-lg p-2.5 sm:p-3 transition-all"
            style={{
              background: "oklch(0.05 0 0)",
              border: "1px solid oklch(0.18 0.012 27)",
              animation: `slide-up-fade 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + i * 0.15}s both`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.53 0.22 27 / 0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.18 0.012 27)";
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] tracking-wider truncate" style={{ color: "oklch(0.40 0.01 0)" }}>
                  {v.game} · {v.match}
                </p>
                <p className="mt-0.5 text-xs sm:text-sm font-bold" style={{ color: "oklch(0.95 0 0)" }}>
                  {v.result}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold border"
                  style={{
                    background: "oklch(0.53 0.22 27 / 0.1)",
                    borderColor: "oklch(0.53 0.22 27 / 0.3)",
                    color: "oklch(0.53 0.22 27)",
                  }}
                >
                  <Check className="size-2.5" />
                  {v.status}
                </span>
                <p className="mt-0.5 text-[9px] sm:text-[10px] font-bold" style={{ color: "oklch(0.72 0.22 142)" }}>
                  @{v.odds}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div
        className="mt-3 sm:mt-4 rounded-lg p-2.5 sm:p-3 border"
        style={{
          background: "oklch(0.53 0.22 27 / 0.08)",
          borderColor: "oklch(0.53 0.22 27 / 0.25)",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold" style={{ color: "oklch(0.53 0.22 27)" }}>
            <Cpu className="size-3.5 shrink-0" />
            <span className="truncate">SYSTEM ACCESS: GRANTED</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold shrink-0" style={{ color: "oklch(0.72 0.22 142)" }}>
            ✓ EXPOSED
          </span>
        </div>
        <div
          className="mt-2 h-1 sm:h-1.5 overflow-hidden rounded-full"
          style={{ background: "oklch(0.53 0.22 27 / 0.15)" }}
        >
          <div
            className="h-full rounded-full animate-hack-bar"
            style={{ background: "linear-gradient(90deg, oklch(0.53 0.22 27), oklch(0.72 0.22 142))" }}
          />
        </div>
        <p className="mt-1.5 text-[9px] sm:text-[10px]" style={{ color: "oklch(0.40 0.01 0)" }}>
          Next breach cycle:{" "}
          <span style={{ color: "oklch(0.72 0.22 142)" }}>00:03:47</span>
        </p>
      </div>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "oklch(0.05 0 0)" }}>
      {/* Global logo watermark */}
      <LogoWatermark />

      <SiteNavbar />
      <LiveTicker />

      <main className="relative">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden border-b" style={{ borderColor: "oklch(0.18 0.012 27)" }}>
          {/* Matrix rain */}
          <MatrixRain opacity={0.09} />

          {/* Red radial glow top-right */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(60% 60% at 75% 0%, oklch(0.53 0.22 27 / 0.12), transparent 70%)",
            }}
          />
          {/* Green radial glow bottom-left */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(40% 40% at 5% 100%, oklch(0.72 0.22 142 / 0.07), transparent 70%)",
            }}
          />

          <FloatingParticles />

          <div className="relative mx-auto grid max-w-6xl items-center gap-8 sm:gap-12 px-4 py-10 sm:py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            {/* Left column */}
            <div className="animate-rise relative">
              {/* Mobile watermark */}
              <div className="pointer-events-none absolute -top-3 right-0 lg:hidden select-none" aria-hidden="true">
                <LogoSymbol
                  className="h-24 sm:h-28 w-auto animate-logo-tilt origin-center"
                  style={{ opacity: 0.12, filter: "hue-rotate(120deg) brightness(1.5)" }}
                />
              </div>

              {/* Breach badge */}
              <div className="mb-5">
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-bold tracking-widest animate-border-bleed"
                  style={{
                    borderColor: "oklch(0.53 0.22 27 / 0.5)",
                    background: "oklch(0.53 0.22 27 / 0.08)",
                    color: "oklch(0.53 0.22 27)",
                  }}
                >
                  <span className="size-2 rounded-full animate-status-blink" style={{ background: "oklch(0.53 0.22 27)" }} />
                  SYSTEM BREACH ACTIVE
                </span>
              </div>

              {/* Main headline with glitch */}
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-6xl leading-tight" style={{ color: "oklch(0.95 0 0)" }}>
                Instant Virtuals.{" "}
                <GlitchText className="text-primary">
                  Outcome Exposed.
                </GlitchText>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "oklch(0.50 0.01 0)" }}>
                Our proprietary algorithm penetrates the{" "}
                <span className="font-semibold" style={{ color: "oklch(0.72 0.22 142)" }}>
                  SportyBet instant virtual engine
                </span>{" "}
                — delivering the next match outcome before the game even loads. No guesswork. Just exposed results.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="relative overflow-hidden group font-mono font-bold tracking-widest animate-red-glow"
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
                  className="font-mono border-opacity-40"
                  style={{ borderColor: "oklch(0.72 0.22 142 / 0.4)", color: "oklch(0.72 0.22 142)" }}
                >
                  <a href="#how-it-works">
                    <Terminal className="mr-2 size-4" />
                    ENTER THE SYSTEM
                  </a>
                </Button>
              </div>

              {/* Animated stats */}
              <dl className="mt-6 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-6">
                <div>
                  <dt className="text-base sm:text-lg font-bold font-mono" style={{ color: "oklch(0.95 0 0)" }}>
                    <AnimatedCounter end={99} suffix="%" className="tabular-nums" />
                  </dt>
                  <dd className="text-[10px] sm:text-xs font-mono leading-tight mt-0.5" style={{ color: "oklch(0.45 0.01 0)" }}>Accuracy rate</dd>
                </div>
                <div>
                  <dt className="text-base sm:text-lg font-bold font-mono" style={{ color: "oklch(0.95 0 0)" }}>
                    <AnimatedCounter end={14} suffix="K+" className="tabular-nums" />
                  </dt>
                  <dd className="text-[10px] sm:text-xs font-mono leading-tight mt-0.5" style={{ color: "oklch(0.45 0.01 0)" }}>Exposed</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-base sm:text-lg font-bold font-mono" style={{ color: "oklch(0.95 0 0)" }}>
                    <span
                      className="size-2 shrink-0 rounded-full animate-status-blink"
                      style={{ background: "oklch(0.72 0.22 142)" }}
                    />
                    24/7
                  </dt>
                  <dd className="text-[10px] sm:text-xs font-mono leading-tight mt-0.5" style={{ color: "oklch(0.45 0.01 0)" }}>Always live</dd>
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
          <MatrixRain opacity={0.03} />
          <div className="max-w-2xl relative">
            <span
              className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest"
              style={{ color: "oklch(0.53 0.22 27)" }}
            >
              <Activity className="size-3.5" />
              WHY OUR ALGORITHM NEVER FAILS
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl" style={{ color: "oklch(0.95 0 0)" }}>
              Built to Expose, Not Guess
            </h2>
            <p className="mt-3" style={{ color: "oklch(0.48 0.01 0)" }}>
              Every component is engineered to deliver certainty — not predictions.
            </p>
          </div>
          <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl p-5 sm:p-6 transition-all hover:-translate-y-1 cursor-default"
                style={{
                  background: "oklch(0.09 0.004 27)",
                  border: "1px solid oklch(0.18 0.012 27)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "oklch(0.53 0.22 27 / 0.5)";
                  el.style.boxShadow = "0 0 20px oklch(0.53 0.22 27 / 0.1)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "oklch(0.18 0.012 27)";
                  el.style.boxShadow = "none";
                }}
              >
                <span
                  className="inline-flex size-10 items-center justify-center rounded-lg transition-colors"
                  style={{
                    background: "oklch(0.53 0.22 27 / 0.12)",
                    color: "oklch(0.53 0.22 27)",
                  }}
                >
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold font-mono" style={{ color: "oklch(0.95 0 0)" }}>
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "oklch(0.48 0.01 0)" }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="border-y relative" style={{ borderColor: "oklch(0.18 0.012 27)", background: "oklch(0.08 0.003 0)" }}>
          <FloatingParticles />
          <MatrixRain opacity={0.04} />
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16 sm:px-6 lg:py-24 relative">
            <div className="max-w-2xl">
              <span
                className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest"
                style={{ color: "oklch(0.72 0.22 142)" }}
              >
                <Wifi className="size-3.5" />
                BREACH PROTOCOL
              </span>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl" style={{ color: "oklch(0.95 0 0)" }}>
                How The System Works
              </h2>
              <p className="mt-3" style={{ color: "oklch(0.48 0.01 0)" }}>
                Three steps from screenshot to exposed instant virtual outcome.
              </p>
            </div>
            <ol className="mt-8 sm:mt-10 grid gap-4 sm:gap-5 sm:grid-cols-3">
              {steps.map((s, idx) => (
                <li
                  key={s.n}
                  className="group rounded-xl p-5 sm:p-6 transition-all"
                  style={{
                    background: "oklch(0.09 0.004 27)",
                    border: "1px solid oklch(0.18 0.012 27)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "oklch(0.72 0.22 142 / 0.4)";
                    el.style.boxShadow = "0 0 16px oklch(0.72 0.22 142 / 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "oklch(0.18 0.012 27)";
                    el.style.boxShadow = "none";
                  }}
                >
                  <span
                    className="inline-flex size-10 items-center justify-center rounded-full text-sm font-bold tracking-widest font-mono transition-colors"
                    style={{
                      background: idx === 1 ? "oklch(0.72 0.22 142 / 0.15)" : "oklch(0.53 0.22 27 / 0.12)",
                      color: idx === 1 ? "oklch(0.72 0.22 142)" : "oklch(0.53 0.22 27)",
                    }}
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold font-mono" style={{ color: "oklch(0.95 0 0)" }}>
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "oklch(0.48 0.01 0)" }}>
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── PACKAGES ── */}
        <section id="packages" className="mx-auto max-w-6xl px-4 py-10 sm:py-16 sm:px-6 lg:py-24 relative">
          <MatrixRain opacity={0.03} />
          <div className="max-w-2xl relative">
            <span
              className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest"
              style={{ color: "oklch(0.53 0.22 27)" }}
            >
              <Database className="size-3.5" />
              ACCESS TIERS
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl" style={{ color: "oklch(0.95 0 0)" }}>
              Choose Your Access Level
            </h2>
            <p className="mt-3" style={{ color: "oklch(0.48 0.01 0)" }}>
              Each tier is a bundle of scan credits. One credit processes one screenshot and exposes your instant virtual outcome.
            </p>
          </div>
          <div className="mt-8 sm:mt-10 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 relative">
            {packages.map((p) => (
              <div
                key={p.name}
                className={cn(
                  "group relative flex flex-col rounded-2xl p-5 sm:p-8 transition-all duration-300 overflow-hidden",
                  p.popular ? "scale-[1.01] sm:scale-[1.02]" : "hover:-translate-y-1"
                )}
                style={{
                  background: p.popular
                    ? "linear-gradient(135deg, oklch(0.13 0.008 27), oklch(0.09 0.004 27))"
                    : "oklch(0.09 0.004 27)",
                  border: p.popular
                    ? "1px solid oklch(0.53 0.22 27 / 0.6)"
                    : "1px solid oklch(0.18 0.012 27)",
                  boxShadow: p.popular
                    ? "0 0 30px oklch(0.53 0.22 27 / 0.15), 0 20px 60px oklch(0 0 0 / 0.5)"
                    : "none",
                }}
              >
                {/* Popular top accent */}
                {p.popular && (
                  <div
                    className="absolute inset-x-0 top-0 h-0.5"
                    style={{ background: "linear-gradient(90deg, oklch(0.53 0.22 27), oklch(0.72 0.22 142), oklch(0.53 0.22 27))" }}
                  />
                )}

                {/* Logo watermark */}
                <div className="pointer-events-none absolute -bottom-6 -right-6 select-none overflow-hidden" aria-hidden="true">
                  <LogoSymbol
                    className={cn(
                      "h-44 w-auto transition-all duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3",
                      p.popular ? "opacity-[0.08]" : "opacity-[0.04] group-hover:opacity-[0.07]"
                    )}
                    style={{ filter: "hue-rotate(120deg) brightness(1.5)" }}
                  />
                </div>

                {/* Header */}
                <div className="relative flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight font-mono" style={{ color: "oklch(0.95 0 0)" }}>
                      {p.name}
                    </h3>
                    <p className="mt-1 text-xs font-mono" style={{ color: "oklch(0.45 0.01 0)" }}>
                      Instant Virtual Football
                    </p>
                  </div>
                  {p.badge && (
                    <Badge
                      className="rounded font-mono text-xs font-semibold px-2.5 py-1 shrink-0 border"
                      style={
                        p.popular
                          ? { background: "oklch(0.53 0.22 27)", color: "oklch(0.97 0 0)", borderColor: "transparent" }
                          : { background: "oklch(0.53 0.22 27 / 0.1)", color: "oklch(0.53 0.22 27)", borderColor: "oklch(0.53 0.22 27 / 0.25)" }
                      }
                    >
                      {p.badge}
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <div className="relative mt-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono" style={{ color: "oklch(0.95 0 0)" }}>
                      {p.price}
                    </span>
                    <span className="text-xs font-medium font-mono" style={{ color: "oklch(0.45 0.01 0)" }}>one-time</span>
                  </div>
                  <div
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs font-semibold border"
                    style={{
                      background: "oklch(0.72 0.22 142 / 0.08)",
                      borderColor: "oklch(0.72 0.22 142 / 0.25)",
                      color: "oklch(0.72 0.22 142)",
                    }}
                  >
                    <Sparkles className="size-3.5" />
                    <span>{p.credits}</span>
                  </div>
                </div>

                {/* Perks */}
                <ul className="relative mt-6 flex-1 space-y-3">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm transition-colors font-mono" style={{ color: "oklch(0.50 0.01 0)" }}>
                      <span
                        className="inline-flex size-4 shrink-0 items-center justify-center rounded mt-0.5 border"
                        style={{
                          background: "oklch(0.53 0.22 27 / 0.1)",
                          borderColor: "oklch(0.53 0.22 27 / 0.25)",
                          color: "oklch(0.53 0.22 27)",
                        }}
                      >
                        <Check className="size-3 stroke-[2.5]" />
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="relative mt-8">
                  <Button
                    className="w-full group/btn relative overflow-hidden font-semibold font-mono tracking-widest"
                    variant={p.popular ? "default" : "outline"}
                    size="lg"
                    asChild
                    style={
                      p.popular
                        ? { boxShadow: "0 0 16px oklch(0.53 0.22 27 / 0.4)" }
                        : { borderColor: "oklch(0.53 0.22 27 / 0.4)", color: "oklch(0.53 0.22 27)" }
                    }
                  >
                    <Link to="/register" className="flex items-center justify-center gap-2">
                      <span>GET {p.name.toUpperCase()} ACCESS</span>
                      <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRUST ── */}
        <section
          className="border-y"
          style={{ borderColor: "oklch(0.18 0.012 27)", background: "oklch(0.08 0.003 0)" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trust.map((t) => (
                <div key={t.title} className="flex gap-3 group">
                  <span
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                    style={{ background: "oklch(0.09 0.004 27)", color: "oklch(0.53 0.22 27)" }}
                  >
                    <t.icon className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold font-mono" style={{ color: "oklch(0.95 0 0)" }}>
                      {t.title}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: "oklch(0.48 0.01 0)" }}>
                      {t.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-3xl px-4 py-10 sm:py-16 sm:px-6 lg:py-24">
          <span
            className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest"
            style={{ color: "oklch(0.72 0.22 142)" }}
          >
            <Eye className="size-3.5" />
            FREQUENTLY ASKED
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl" style={{ color: "oklch(0.95 0 0)" }}>
            Questions &amp; Intel
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((f) => (
              <AccordionItem
                key={f.q}
                value={f.q}
                style={{ borderColor: "oklch(0.18 0.012 27)" }}
              >
                <AccordionTrigger
                  className="text-left text-base font-semibold font-mono"
                  style={{ color: "oklch(0.85 0 0)" }}
                >
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed" style={{ color: "oklch(0.50 0.01 0)" }}>
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ── CTA BANNER ── */}
        <section
          className="border-t relative overflow-hidden"
          style={{
            borderColor: "oklch(0.53 0.22 27 / 0.4)",
            background: "linear-gradient(135deg, oklch(0.40 0.22 27 / 0.95), oklch(0.30 0.20 27))",
          }}
        >
          <MatrixRain opacity={0.08} />
          <FloatingParticles />
          <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center sm:px-6 relative">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] sm:text-xs font-bold tracking-widest"
              style={{ borderColor: "oklch(0.97 0 0 / 0.3)", color: "oklch(0.97 0 0 / 0.9)" }}
            >
              <span className="size-2 shrink-0 rounded-full bg-white animate-status-blink" />
              <span>SYSTEM ONLINE — READY TO BREACH</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl" style={{ color: "oklch(0.97 0 0)" }}>
              Ready to Expose Your First Instant Virtual?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: "oklch(0.97 0 0 / 0.75)" }}>
              Create your Virtu-IQ account and start receiving exposed instant virtual outcomes in minutes.
            </p>
            <Button
              size="lg"
              className="mt-6 sm:mt-8 group font-mono font-bold tracking-widest"
              style={{
                background: "oklch(0.97 0 0)",
                color: "oklch(0.30 0.20 27)",
                boxShadow: "0 0 20px oklch(0 0 0 / 0.3)",
              }}
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
