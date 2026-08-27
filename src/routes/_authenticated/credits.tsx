import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock,
  Coins,
  Copy,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { usePaymentRealtime } from "@/hooks/usePaymentRealtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { PageHeader } from "@/components/app/AppShell";
import { LogoSymbol, LogoWatermark } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import {
  creditHistoryQuery,
  ghs,
  packagesQuery,
  paymentSettingsQuery,
  paymentsQuery,
  profileQuery,
  verdictLimitQuery,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/credits")({
  head: () => ({
    meta: [
      { title: "Credits & Packages — Virtu-IQ" },
      { name: "description", content: "Track your Virtu-IQ prediction credits and upgrade your plan with the Starter, Plus or Premium package." },
      { property: "og:title", content: "Credits & Packages — Virtu-IQ" },
      { property: "og:description", content: "Monitor your credit balance and upgrade your Virtu-IQ plan." },
    ],
  }),
  component: CreditsPage,
});


function CreditsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: payments } = useQuery(paymentsQuery(user.id));
  const hasPending = (payments ?? []).some((p) => p.status === "pending");
  const { data: profile } = useQuery({
    ...profileQuery(user.id),
    refetchInterval: hasPending ? 4000 : false,
  });
  const { data: packages } = useQuery(packagesQuery());
  const { data: history } = useQuery({
    ...creditHistoryQuery(user.id),
    refetchInterval: hasPending ? 4000 : false,
  });
  const { data: verdictLimit } = useQuery(verdictLimitQuery(user.id));
  usePaymentRealtime(user.id);

  const seen = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    if (!payments) return;
    const next = new Map(payments.map((p) => [p.id, p.status as string]));
    const prev = seen.current;
    seen.current = next;
    if (!prev) return;
    const justApproved = payments.find(
      (p) => p.status === "approved" && prev.get(p.id) === "pending",
    );
    if (justApproved) {
      void queryClient.invalidateQueries();
      toast.success(`Payment approved — ${justApproved.credits} credits added`);
      window.setTimeout(() => {
        void navigate({ to: "/analyze" });
      }, 1400);
    }
  }, [payments, navigate, queryClient]);

  const credits = profile?.credits ?? 0;
  const capacity = Math.max(
    credits,
    ...(packages ?? []).map((p) => p.credits),
    10,
  );
  const pct = capacity > 0 ? Math.min(100, Math.round((credits / capacity) * 100)) : 0;
  const spent = (history ?? []).reduce((sum, t) => (t.delta < 0 ? sum - t.delta : sum), 0);
  const pending = (payments ?? []).filter((p) => p.status === "pending").length;
  const low = credits <= 2;

  return (
    <>
      <PageHeader
        title="Credits"
        description="One credit powers one Virtu-IQ instant virtual football scan."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary via-primary to-[#1D4ED8] p-6 text-primary-foreground shadow-[var(--shadow-soft)] sm:p-8 lg:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-black/20 blur-3xl" />
          <LogoWatermark />
          <LogoSymbol
            className="pointer-events-none absolute right-5 top-5 h-7 w-auto opacity-70"
            aria-hidden
          />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Coins className="size-3.5" /> Virtu-IQ balance
              </span>
              {low && <Badge className="bg-white text-primary hover:bg-white">Running low</Badge>}
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <p className="text-6xl font-extrabold leading-none tracking-tight">{credits}</p>
              <div className="pb-1">
                <p className="text-sm font-semibold">scans / credits available</p>
                <p className="text-xs opacity-75">1 credit deducted per screenshot analyzed</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-xs">
                Active Plan: {verdictLimit ?? 2} verdicts / predictions per scan
              </span>
            </div>

            <div className="mt-6">
              <Progress
                value={pct}
                className="h-3 bg-white/20 [&>div]:bg-white [&>div]:transition-all [&>div]:duration-700"
              />
              <div className="mt-2 flex justify-between text-xs opacity-85">
                <span>{pct}% of a {capacity}-credit top-up</span>
                <span>{capacity} max</span>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <UpgradeDialog />
              {pending > 0 && (
                <span className="text-xs opacity-85">
                  {pending} payment{pending === 1 ? "" : "s"} awaiting approval
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-5">
          <MiniStat icon={Zap} label="Credits used" value={String(spent)} hint="Verdicts delivered so far" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Payment requests</h2>
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {(payments ?? []).length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">No payments submitted yet.</p>
            )}
            {(payments ?? []).map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {ghs(p.amount_ghs)} · {p.credits} credits
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.method} · {p.reference}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                  {p.admin_note && (
                    <p className="mt-1 text-xs text-muted-foreground">Note: {p.admin_note}</p>
                  )}
                </div>
                <Badge
                  className={cn(
                    "font-bold uppercase tracking-wider text-[11px] px-2.5 py-0.5 shadow-xs border-transparent",
                    p.status === "approved"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : p.status === "rejected"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                  )}
                >
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Credit ledger</h2>
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {(history ?? []).length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">No credit activity yet.</p>
            )}
            {(history ?? []).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm text-foreground">{t.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    t.delta > 0 ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {t.delta > 0 ? "+" : ""}
                  {t.delta}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function UpgradeDialog() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: packages } = useQuery(packagesQuery());
  const { data: settings } = useQuery(paymentSettingsQuery());
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<string | null>(null);
  const method = settings?.network ?? "MTN MoMo";
  const [senderName, setSenderName] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const { data: livePayments } = useQuery({
    ...paymentsQuery(user.id),
    refetchInterval: paymentId ? 3000 : false,
  });
  const livePayment = paymentId ? (livePayments ?? []).find((p) => p.id === paymentId) : undefined;
  const approved = livePayment?.status === "approved";
  const rejected = livePayment?.status === "rejected";

  const pkg = (packages ?? []).find((p) => p.id === selected) ?? null;

  const [momoCopied, setMomoCopied] = useState(false);
  const handleCopyMomo = async () => {
    const num = settings?.momo_number;
    if (!num) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(num);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = num;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setMomoCopied(true);
      toast.success("Payment number copied!");
      setTimeout(() => setMomoCopied(false), 2200);
    } catch {
      toast.error("Please copy the number manually.");
    }
  };

  const reset = () => {
    setStep(1);
    setSelected(null);
    setSenderName("");
    setPaymentId(null);
    setMomoCopied(false);
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!pkg) throw new Error("Choose a package first.");
      const name = senderName.trim();
      if (name.length < 2 || name.length > 80) {
        throw new Error("Enter the MoMo name on the account you paid from (2-80 characters).");
      }
      const { data, error } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          amount_ghs: pkg.price_ghs,
          credits: pkg.credits,
          kind: "package",
          method,
          sender_name: name,
          reference: "Not provided",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data.id as string;
    },
    onSuccess: async (id: string) => {
      setPaymentId(id);
      setStep(3);
      void supabase.channel("admin-realtime-websocket").send({
        type: "broadcast",
        event: "payment-submitted",
        payload: { userId: user.id },
      });
      await queryClient.invalidateQueries({ queryKey: ["payments", user.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="bg-white text-primary shadow-sm hover:bg-white/90">
          Upgrade plan
          <ArrowUpRight className="ml-1 size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Choose your Virtu-IQ package" : step === 2 ? "Make your payment" : "Payment pending approval"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Step 1 of 3 — pick the plan that matches how many verdicts you want per screenshot."
              : step === 2
                ? "Step 2 of 3 — send the exact amount to the number below, then confirm your details."
                : "Step 3 of 3 — we have received your submission."}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-1 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {(packages ?? []).map((pkg) => {
            const popular = pkg.slug === "plus";
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => {
                  setSelected(pkg.id);
                  setStep(2);
                }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-shadow duration-300",
                  popular
                    ? "border-primary/50 bg-gradient-to-br from-primary via-primary to-[#1D4ED8] text-primary-foreground shadow-[var(--shadow-soft)] hover:shadow-lg"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-[var(--shadow-soft)]",
                )}
              >
                {popular && (
                  <span className="pointer-events-none absolute -right-14 -top-14 size-40 rounded-full bg-white/15 blur-2xl" />
                )}
                <LogoSymbol
                  className={cn(
                    "pointer-events-none absolute -right-5 -bottom-7 h-36 w-auto",
                    popular ? "opacity-[0.16]" : "opacity-[0.07]",
                  )}
                  aria-hidden
                />
                <div className="relative">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={cn("font-bold", popular ? "" : "text-foreground")}>{pkg.name}</h3>
                    {popular && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        <Sparkles className="size-3" /> Popular
                      </span>
                    )}
                  </div>
                  <p className={cn("mt-2 text-2xl font-extrabold tracking-tight", popular ? "" : "text-foreground")}>
                    {ghs(pkg.price_ghs)}
                  </p>
                  <p className={cn("mt-1 text-sm", popular ? "opacity-85" : "text-muted-foreground")}>
                    {pkg.credits} scan credits
                  </p>
                  <p
                    className={cn(
                      "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      popular ? "bg-white/20" : "bg-primary/10 text-primary",
                    )}
                  >
                    {pkg.max_verdicts} verdict{pkg.max_verdicts === 1 ? "" : "s"} per screenshot
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {((pkg.perks as string[]) ?? []).map((perk) => (
                      <li
                        key={perk}
                        className={cn("flex gap-2 text-xs", popular ? "opacity-90" : "text-muted-foreground")}
                      >
                        <Check className={cn("mt-0.5 size-3.5 shrink-0", popular ? "" : "text-primary")} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <span
                    className={cn(
                      "mt-4 inline-flex items-center gap-1 text-xs font-semibold",
                      popular ? "" : "text-primary",
                    )}
                  >
                    Choose {pkg.name} <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
          {(packages ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No packages available right now.</p>
          )}
        </div>
        )}

        {step === 2 && pkg && (
        <form
          className="mt-2 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-[#1D4ED8] p-5 text-primary-foreground">
            <LogoWatermark className="h-52 sm:h-60" />
            <div className="relative flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{pkg.name} plan</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">{ghs(pkg.price_ghs)}</p>
              </div>
              <p className="text-xs opacity-90">
                {pkg.credits} credits · {pkg.max_verdicts} verdict{pkg.max_verdicts === 1 ? "" : "s"} per screenshot
              </p>
            </div>
          </div>

          <div className="relative grid gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5">
            <LogoSymbol
              className="pointer-events-none absolute -right-4 -bottom-6 h-28 w-auto opacity-[0.06]"
              aria-hidden
            />
            <div className="relative flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Pay to ({settings?.network ?? "MoMo"})</p>
                <p className="text-lg font-bold tracking-tight text-foreground">
                  {settings?.momo_number ?? "—"}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-w-[90px] transition-all"
                onClick={handleCopyMomo}
              >
                {momoCopied ? (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-600 animate-in zoom-in-75 duration-200">
                    <Check className="size-3.5 stroke-[3]" /> Copied!
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Copy className="size-3.5" /> Copy
                  </span>
                )}
              </Button>
            </div>
            <div className="relative">
              <p className="text-xs text-muted-foreground">Recipient name</p>
              <p className="text-sm font-medium text-foreground">{settings?.recipient_name ?? "—"}</p>
            </div>
            {settings?.instructions && (
              <p className="relative text-xs text-muted-foreground">{settings.instructions}</p>
            )}
          </div>

          <div className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Payment method</Label>
              <div className="flex h-10 items-center rounded-lg border border-border bg-secondary/60 px-3">
                <span className="text-sm font-semibold text-foreground">{method}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender">Your MoMo name</Label>
              <Input
                id="sender"
                value={senderName}
                maxLength={80}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Name on the account you paid from"
                required
              />
            </div>

          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-1 size-4" /> Previous
            </Button>
            <Button type="submit" className="flex-1" disabled={submit.isPending}>
              {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              I have paid
            </Button>
          </div>
        </form>
        )}

        {step === 3 && (
          <div className="animate-verdict relative mt-2 overflow-hidden rounded-2xl border border-border bg-card p-6 text-center">
            <LogoSymbol
              className="pointer-events-none absolute -right-6 -bottom-8 h-40 w-auto opacity-[0.06]"
              aria-hidden
            />
            <span className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {!approved && !rejected && (
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" aria-hidden />
              )}
              {approved ? <Check className="relative size-7" /> : <Clock className="relative size-7" />}
            </span>
            <h3 className="relative mt-4 text-lg font-bold text-foreground">
              {approved
                ? "Payment approved"
                : rejected
                  ? "Payment declined"
                  : "Waiting approval"}
            </h3>
            <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {approved
                ? "Your credits have landed. Taking you to a new analysis…"
                : rejected
                  ? livePayment?.admin_note || "Please check your payment details and submit again."
                  : "Your payment is being verified against the MoMo name you provided. This updates live — no need to reload."}
            </p>

            <dl className="relative mx-auto mt-6 grid max-w-md gap-2 rounded-xl border border-border bg-muted/30 p-4 text-left text-sm">
              <Row label="Package" value={pkg ? `${pkg.name} · ${ghs(pkg.price_ghs)}` : "—"} />
              <Row label="Credits" value={pkg ? `${pkg.credits} credits` : "—"} />
              <Row
                label="Verdicts / scan"
                value={pkg ? String(pkg.max_verdicts) : "—"}
              />
              <Row label="Method" value={method} />
              <Row label="MoMo name" value={senderName} />
              <Row
                label="Status"
                value={approved ? "Approved" : rejected ? "Declined" : "Pending approval"}
              />
            </dl>

            {rejected && (
              <Button className="relative mt-6" onClick={() => reset()}>
                <ArrowLeft className="mr-1 size-4" /> Choose a package again
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
