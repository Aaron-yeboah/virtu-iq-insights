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
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { LogoSymbol } from "@/components/brand/Logo";
import symbolLogo from "@/assets/virtu-iq-symbol.png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Virtu-IQ — Verified Verdicts You Can Trust" },
      {
        name: "description",
        content:
          "Virtu-IQ delivers expert-grade verdicts on virtual football screenshots. Upload, get your locked-in results, and play with confidence.",
      },
      { property: "og:title", content: "Virtu-IQ — Verified Verdicts You Can Trust" },
      {
        property: "og:description",
        content:
          "Upload your virtual football screenshot and receive certified verdicts — no guesswork, just results.",
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
              description: "50 scan credits, 2 verdicts per screenshot.",
              price: "250",
            },
            {
              name: "Plus",
              description: "100 scan credits, 4 verdicts per screenshot.",
              price: "350",
            },
            {
              name: "Premium",
              description: "200 scan credits, 8 verdicts per screenshot.",
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
    icon: Target,
    title: "Precision Verdicts",
    body: "Every screenshot is decoded with expert-level accuracy. Your verdicts are locked in — no second-guessing.",
  },
  {
    icon: Trophy,
    title: "Proven Track Record",
    body: "Thousands of users trust our platform daily. Results speak louder than promises.",
  },
  {
    icon: ShieldCheck,
    title: "Bankroll Protection",
    body: "Your account, uploads, and verdicts are secured with enterprise-grade access controls.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    body: "Upload your screenshot and receive your locked verdicts within moments. No delays, no waiting.",
  },
];

const steps = [
  { n: "01", title: "Upload", body: "Drop your virtual football screenshot — any supported format." },
  { n: "02", title: "Lock In", body: "Our system processes the image and locks in your verdicts with precision." },
  { n: "03", title: "Collect", body: "Receive your certified verdicts — ready to use, ready to trust." },
];

const packages = [
  {
    name: "Starter",
    price: "GH₵250",
    credits: "2 verdicts per screenshot",
    perks: ["50 scan credits", "Instant virtual football only", "Verdict history", "Email support"],
    popular: false,
    badge: null,
  },
  {
    name: "Plus",
    price: "GH₵350",
    credits: "4 verdicts per screenshot",
    perks: ["100 scan credits", "Instant virtual football only", "Verdict history", "Priority email support"],
    popular: false,
    badge: "🔥 Best Value",
  },
  {
    name: "Premium",
    price: "GH₵500",
    credits: "8 verdicts per screenshot",
    perks: ["200 scan credits", "Instant virtual football only", "Verdict history", "Priority support"],
    popular: true,
    badge: "⚡ Most Popular",
  },
];

const trust = [
  { icon: Lock, title: "Secure & private", body: "Your account and data are protected at every level." },
  { icon: ShieldCheck, title: "Verified results", body: "Every verdict goes through our proven verification engine." },
  { icon: TrendingUp, title: "Consistent delivery", body: "Thousands of verdicts delivered with industry-leading reliability." },
  { icon: Receipt, title: "Transparent pricing", body: "Clear packages, visible history — no hidden fees ever." },
];

const faqs = [
  {
    q: "How does the verdict system work?",
    a: "You upload a virtual football screenshot and Virtu-IQ's system processes the image, extracts the relevant match data, and delivers locked-in verdicts you can trust.",
  },
  {
    q: "Which images are supported?",
    a: "PNG, JPG, JPEG and WEBP screenshots. Clear, high-resolution images produce the most accurate verdicts.",
  },
  {
    q: "What are verdict credits?",
    a: "Each package includes verdict credits. One credit processes one screenshot and delivers your locked verdicts. Credits are consumed per scan.",
  },
  {
    q: "How is my account secured?",
    a: "Accounts use managed authentication, and database access is restricted so you can only ever read your own profile, payments, verdicts and notifications.",
  },
  {
    q: "How is payment verified?",
    a: "You submit your payment with its reference. It is recorded as pending, reviewed server-side by an administrator, and credits are added only once the payment is approved.",
  },
  {
    q: "Can I review past verdicts?",
    a: "Yes. Every completed verdict is saved to your history with its ID, date, image and status, and can be reopened or downloaded at any time.",
  },
];

/* ── Logo Watermark Background ── */
function LogoWatermark() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]" aria-hidden="true">
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
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Hero Verdict Card ── */
function HeroVerdictCard() {
  const verdicts = [
    { match: "Man City vs Arsenal", verdict: "Over 2.5", status: "LOCKED", confidence: "High" },
    { match: "Barcelona vs Real Madrid", verdict: "BTTS — Yes", status: "LOCKED", confidence: "High" },
    { match: "Liverpool vs Chelsea", verdict: "Home Win", status: "LOCKED", confidence: "High" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-lift)] sm:p-6 relative overflow-hidden">
      {/* Shine sweep effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 w-[30%] bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shine" />
      </div>

      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-green-500 animate-status-blink" />
          <span className="text-xs font-semibold text-green-600 dark:text-green-400">LIVE</span>
        </div>
        <Badge variant="secondary" className="text-[11px] gap-1">
          <CheckCircle2 className="size-3 text-green-500" />
          Verdicts Locked
        </Badge>
      </div>

      <div className="mt-5 space-y-3 relative">
        {verdicts.map((v, i) => (
          <div
            key={v.match}
            className="rounded-xl border border-border bg-background p-3 transition-all hover:border-primary/30 hover:shadow-sm"
            style={{ animation: `slide-up-fade 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + i * 0.15}s both` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{v.match}</p>
                <p className="mt-1 text-sm font-bold text-foreground">{v.verdict}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                  <Check className="size-3" />
                  {v.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-primary/8 p-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Trophy className="size-4" />
            3/3 Verdicts Delivered
          </div>
          <span className="text-[10px] font-bold text-green-600 dark:text-green-400">✓ ALL LOCKED</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/20">
          <div className="h-full w-full rounded-full bg-primary transition-all duration-1000" />
        </div>
      </div>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Global logo watermark */}
      <LogoWatermark />

      <SiteNavbar />

      {/* Live ticker */}
      <LiveTicker />

      <main className="relative">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_0%,var(--color-accent),transparent_70%)]" />
          <FloatingParticles />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="animate-rise relative">
              {/* Mobile top-right watermark logo with left/right tilting animation */}
              <div
                className="pointer-events-none absolute -top-3 right-0 lg:hidden select-none"
                aria-hidden="true"
              >
                <LogoSymbol className="h-24 sm:h-28 w-auto opacity-[0.16] dark:opacity-[0.22] animate-logo-tilt origin-center" />
              </div>

              <div>
                <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1">
                  <Lock className="size-3.5 text-primary" />
                  Verified Verdicts Platform
                </Badge>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Your Verdicts.{" "}
                <span className="text-primary">Locked In.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Upload your virtual football screenshot. Get expert-grade verdicts
                you can trust — no guesswork, just results.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="relative overflow-hidden group" asChild>
                  <Link to="/register">
                    <span className="relative z-10 flex items-center gap-2">
                      Start Winning <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>

              {/* Animated stats */}
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
                <div>
                  <dt className="text-lg font-bold text-foreground">
                    <AnimatedCounter end={98} suffix="%" className="tabular-nums" />
                  </dt>
                  <dd className="text-xs text-muted-foreground">Verified rate</dd>
                </div>
                <div>
                  <dt className="text-lg font-bold text-foreground">
                    <AnimatedCounter end={10} suffix="K+" className="tabular-nums" />
                  </dt>
                  <dd className="text-xs text-muted-foreground">Verdicts delivered</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-lg font-bold text-foreground">
                    <span className="size-2 rounded-full bg-green-500 animate-status-blink" />
                    24/7
                  </dt>
                  <dd className="text-xs text-muted-foreground">Always live</dd>
                </div>
              </dl>
            </div>
            <div className="animate-rise">
              <HeroVerdictCard />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24 relative">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why Thousands Trust Virtu-IQ
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for those who demand certainty — every feature is designed to deliver.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] hover:border-primary/20"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-border bg-secondary/40 relative">
          <FloatingParticles />
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24 relative">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-3 text-muted-foreground">
                Three steps from screenshot to certified verdict.
              </p>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold tracking-widest text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Packages */}
        <section id="packages" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Choose Your Package
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every package is a bundle of verdict credits. One credit processes one
              screenshot and delivers your locked verdicts.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {packages.map((p) => (
              <div
                key={p.name}
                className={cn(
                  "group relative flex flex-col rounded-3xl border bg-card p-6 sm:p-8 transition-all duration-300 overflow-hidden",
                  p.popular
                    ? "border-primary/50 bg-gradient-to-b from-primary/[0.04] via-card to-card shadow-xl shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]"
                    : "border-border/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                )}
              >
                {/* Popular card top accent border */}
                {p.popular && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
                )}

                {/* Branded Logo Watermark Background */}
                <div
                  className="pointer-events-none absolute -bottom-6 -right-6 select-none overflow-hidden"
                  aria-hidden="true"
                >
                  <LogoSymbol
                    className={cn(
                      "h-44 w-auto transition-all duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3",
                      p.popular
                        ? "opacity-[0.14] dark:opacity-[0.18]"
                        : "opacity-[0.06] dark:opacity-[0.08] group-hover:opacity-[0.11] dark:group-hover:opacity-[0.14]"
                    )}
                  />
                </div>

                {/* Card Header */}
                <div className="relative flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{p.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Instant Virtual Football</p>
                  </div>
                  {p.badge && (
                    <Badge
                      className={cn(
                        "rounded-full text-xs font-semibold px-3 py-1 shadow-sm shrink-0",
                        p.popular
                          ? "bg-primary text-primary-foreground border-transparent"
                          : "bg-primary/10 text-primary border-primary/20"
                      )}
                    >
                      {p.badge}
                    </Badge>
                  )}
                </div>

                {/* Pricing & Credits */}
                <div className="relative mt-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
                      {p.price}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">one-time</span>
                  </div>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="size-3.5" />
                    <span>{p.credits}</span>
                  </div>
                </div>

                {/* Perks List */}
                <ul className="relative mt-6 flex-1 space-y-3">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm text-muted-foreground group-hover:text-foreground/90 transition-colors">
                      <span className="inline-flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                        <Check className="size-3 stroke-[2.5]" />
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="relative mt-8">
                  <Button
                    className="w-full group/btn relative overflow-hidden font-semibold shadow-sm"
                    variant={p.popular ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link to="/register" className="flex items-center justify-center gap-2">
                      <span>Choose {p.name}</span>
                      <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trust.map((t) => (
                <div key={t.title} className="flex gap-3 group">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary transition-colors group-hover:bg-primary/10">
                    <t.icon className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{t.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left text-base font-semibold text-foreground">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-primary relative overflow-hidden">
          <FloatingParticles />
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 relative">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to Lock In Your First Verdict?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Create your Virtu-IQ account and start receiving certified verdicts in minutes.
            </p>
            <Button size="lg" variant="secondary" className="mt-8 group" asChild>
              <Link to="/register">
                Start Winning <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
