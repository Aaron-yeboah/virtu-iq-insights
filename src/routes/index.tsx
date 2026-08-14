import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ScanSearch,
  Sparkles,
  ShieldCheck,
  Workflow,
  Check,
  ArrowRight,
  FileText,
  Gauge,
  Lock,
  Receipt,
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Virtu-IQ — Turn Screenshots Into Intelligent Insights" },
      {
        name: "description",
        content:
          "Virtu-IQ is an AI visual analytics platform: upload a screenshot and receive a clear, structured report of the information it detects.",
      },
      { property: "og:title", content: "Virtu-IQ — Turn Screenshots Into Intelligent Insights" },
      {
        property: "og:description",
        content:
          "Upload visual information and let Virtu-IQ's AI analyze, organize, and explain what it sees.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: ScanSearch,
    title: "AI Image Analysis",
    body: "Upload screenshots and extract the relevant visual information automatically.",
  },
  {
    icon: Sparkles,
    title: "Smart Insights",
    body: "Transform detected information into an easy-to-understand structured report.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    body: "Accounts and uploaded information stay protected with strict access controls.",
  },
  {
    icon: Workflow,
    title: "Simple Workflow",
    body: "Upload, analyze, and review your results in just a few simple steps.",
  },
];

const steps = [
  { n: "01", title: "Upload", body: "Upload a supported screenshot from your device." },
  { n: "02", title: "Analyze", body: "Virtu-IQ processes the image using AI image analysis." },
  { n: "03", title: "Review", body: "Receive a structured analysis report you can download." },
];

const packages = [
  {
    name: "Starter",
    price: "GH₵250",
    credits: "2 verdicts per screenshot",
    perks: ["50 scan credits", "Instant virtual football only", "Analysis history", "Email support"],
    popular: false,
  },
  {
    name: "Plus",
    price: "GH₵350",
    credits: "4 verdicts per screenshot",
    perks: ["100 scan credits", "Instant virtual football only", "Analysis history", "Priority email support"],
    popular: false,
  },
  {
    name: "Premium",
    price: "GH₵500",
    credits: "8 verdicts per screenshot",
    perks: ["200 scan credits", "Instant virtual football only", "Analysis history", "Priority support"],
    popular: true,
  },
];

const trust = [
  { icon: Lock, title: "Secure authentication", body: "Every account is protected by managed authentication." },
  { icon: ShieldCheck, title: "Protected uploads", body: "Uploaded screenshots are stored privately, never public." },
  { icon: Gauge, title: "Usage tracking", body: "See exactly how many analysis credits you have used." },
  { icon: Receipt, title: "Transparent billing", body: "Clear package pricing with a visible payment history." },
];

const faqs = [
  {
    q: "How does the analysis work?",
    a: "You upload a screenshot and Virtu-IQ's AI reads the image, detects the information it contains, and organizes it into a structured report with extracted text, visual elements, and observations.",
  },
  {
    q: "Which images are supported?",
    a: "PNG, JPG, JPEG and WEBP screenshots. Clear, high-resolution images produce the most accurate reports.",
  },
  {
    q: "What are analysis credits?",
    a: "Each package includes a number of AI analysis credits. One credit is used per screenshot analysis. Credits are not predictions or guaranteed outcomes — they pay for the AI processing of your image.",
  },
  {
    q: "How is my account secured?",
    a: "Accounts use managed authentication, and database access is restricted so you can only ever read your own profile, payments, analyses and notifications.",
  },
  {
    q: "How is payment verified?",
    a: "You submit your payment with its reference. It is recorded as pending, reviewed server-side by an administrator, and credits are added only once the payment is approved.",
  },
  {
    q: "Can I review past analyses?",
    a: "Yes. Every completed analysis is saved to your history with its ID, date, image and status, and can be reopened or downloaded at any time.",
  },
];

function HeroVisual() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-lift)] sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-primary/60" />
        </div>
        <Badge variant="secondary" className="text-[11px]">Analysis Complete</Badge>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-dashed border-border bg-secondary/50 p-4">
          <p className="text-xs font-medium text-muted-foreground">Uploaded screenshot</p>
          <div className="mt-3 space-y-2">
            {[90, 72, 84, 60, 78].map((w, i) => (
              <div key={i} className="h-3 rounded bg-border" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-primary">
            <ScanSearch className="size-4" />
            Detecting information…
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: "Extracted text", value: "24 items" },
            { label: "Visual elements", value: "8 regions" },
            { label: "Confidence", value: "High" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"
            >
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-sm font-semibold text-foreground">{row.value}</span>
            </div>
          ))}
          <div className="rounded-lg bg-primary/8 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <FileText className="size-4" /> Report ready to review
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/20">
              <div className="h-full w-4/5 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_0%,var(--color-accent),transparent_70%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="animate-rise">
              <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1">
                <Sparkles className="size-3.5 text-primary" />
                AI visual analytics
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Turn Screenshots Into Intelligent Insights
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Upload visual information and let Virtu-IQ's AI analyze, organize, and explain
                what it sees.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/register">
                    Get Started <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
                {[
                  ["Structured", "reports"],
                  ["Private", "uploads"],
                  ["Credit", "based"],
                ].map(([a, b]) => (
                  <div key={a}>
                    <dt className="text-lg font-bold text-foreground">{a}</dt>
                    <dd className="text-xs text-muted-foreground">{b}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="animate-rise">
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for clarity, not complexity
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to read a screenshot properly — and nothing you don't.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-3 text-muted-foreground">
                Three steps from screenshot to structured report.
              </p>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="rounded-xl border border-border bg-card p-6">
                  <span className="text-sm font-bold tracking-widest text-primary">{s.n}</span>
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
              Packages
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every package is a bundle of AI analysis credits. One credit analyzes one
              screenshot — packages do not include predictions or guaranteed outcomes.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {packages.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-shadow sm:p-8 ${
                  p.popular
                    ? "border-primary shadow-[var(--shadow-lift)]"
                    : "border-border hover:shadow-[var(--shadow-soft)]"
                }`}
              >
                {p.popular && (
                  <Badge className="absolute right-6 top-6 rounded-full">Most Popular</Badge>
                )}
                <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                <p className="mt-4 text-4xl font-extrabold tracking-tight text-foreground">
                  {p.price}
                </p>
                <p className="mt-1.5 text-sm font-medium text-primary">{p.credits}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Button className="mt-8" variant={p.popular ? "default" : "outline"} asChild>
                  <Link to="/register">Choose {p.name}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trust.map((t) => (
                <div key={t.title} className="flex gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
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
        <section className="border-t border-border bg-primary">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to analyze your first screenshot?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Create your Virtu-IQ account and get a structured AI report in minutes.
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link to="/register">
                Get Started <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
