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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app/AppShell";
import { LogoSymbol } from "@/components/brand/Logo";
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

const METHODS = ["MTN MoMo", "Telecel Cash", "AirtelTigo Money", "Bank transfer"];

function CreditsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user.id));
  const { data: packages } = useQuery(packagesQuery());
  const { data: payments } = useQuery({ ...paymentsQuery(user.id), refetchInterval: 10000 });
  const { data: history } = useQuery(creditHistoryQuery(user.id));
  const { data: verdictLimit } = useQuery(verdictLimitQuery(user.id));

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
      navigate({ to: "/analyze" });
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
          <LogoSymbol
            className="pointer-events-none absolute -right-4 -bottom-6 h-52 w-auto opacity-[0.13] mix-blend-screen sm:h-64"
            aria-hidden
          />
          <LogoSymbol
            className="pointer-events-none absolute right-5 top-5 h-7 w-auto opacity-70 mix-blend-screen"
            aria-hidden
          />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Coins className="size-3.5" /> Virtu-IQ balance
              </span>
              {low && <Badge className="bg-white text-primary hover:bg-white">Running low</Badge>}
            </div>

            <div className="mt-6 flex items-end gap-3">
              <p className="text-6xl font-extrabold leading-none tracking-tight">{credits}</p>
              <p className="pb-1 text-sm opacity-80">credits available</p>
            </div>

            <p className="mt-2 text-sm opacity-85">
              Your plan delivers {verdictLimit ?? 1} verdict{(verdictLimit ?? 1) === 1 ? "" : "s"} per scan
            </p>

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
                  variant={
                    p.status === "approved" ? "default" : p.status === "rejected" ? "destructive" : "secondary"
                  }
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
  const [method, setMethod] = useState(METHODS[0]!);
  const [senderName, setSenderName] = useState("");
  const [reference, setReference] = useState("");

  const pkg = (packages ?? []).find((p) => p.id === selected) ?? null;

  const reset = () => {
    setStep(1);
    setSelected(null);
    setSenderName("");
    setReference("");
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!pkg) throw new Error("Choose a package first.");
      const name = senderName.trim();
      if (name.length < 2 || name.length > 80) {
        throw new Error("Enter the MoMo name on the account you paid from (2-80 characters).");
      }
      const ref = reference.trim();
      if (ref.length < 4 || ref.length > 80) {
        throw new Error("Enter the transaction reference from your payment (4-80 characters).");
      }
      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        package_id: pkg.id,
        amount_ghs: pkg.price_ghs,
        credits: pkg.credits,
        method,
        sender_name: name,
        reference: ref,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setStep(3);
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
            const active = selected === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => {
                  setSelected(pkg.id);
                  setStep(2);
                }}
                className={cn(
                  "rounded-xl border-2 bg-card p-5 text-left transition-all",
                  active
                    ? "border-primary shadow-[var(--shadow-soft)]"
                    : "border-border hover:border-primary/50",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">{pkg.name}</h3>
                  {pkg.slug === "plus" && <Badge>Popular</Badge>}
                </div>
                <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
                  {ghs(pkg.price_ghs)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{pkg.credits} scan credits</p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  {pkg.max_verdicts} verdict{pkg.max_verdicts === 1 ? "" : "s"} per screenshot
                </p>
                <ul className="mt-3 space-y-1.5">
                  {((pkg.perks as string[]) ?? []).map((perk) => (
                    <li key={perk} className="flex gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {perk}
                    </li>
                  ))}
                </ul>
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
          className="mt-2 grid gap-4 rounded-xl border border-border bg-muted/30 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {pkg.name} · {ghs(pkg.price_ghs)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pkg.credits} credits · {pkg.max_verdicts} verdict{pkg.max_verdicts === 1 ? "" : "s"} per screenshot
            </p>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Pay to ({settings?.network ?? "MoMo"})</p>
                <p className="text-lg font-bold tracking-tight text-foreground">
                  {settings?.momo_number ?? "—"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(settings?.momo_number ?? "");
                  toast.success("Number copied");
                }}
              >
                <Copy className="mr-1 size-3.5" /> Copy
              </Button>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recipient name</p>
              <p className="text-sm font-medium text-foreground">{settings?.recipient_name ?? "—"}</p>
            </div>
            {settings?.instructions && (
              <p className="text-xs text-muted-foreground">{settings.instructions}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reference">Transaction reference</Label>
              <Input
                id="reference"
                value={reference}
                maxLength={80}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. MP2401.1234.567890"
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
          <div className="mt-2 rounded-xl border border-border bg-card p-6 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="size-7" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-foreground">Awaiting admin approval</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Your payment is being verified against the MoMo name you provided. Credits land
              automatically once it is approved.
            </p>

            <dl className="mx-auto mt-6 grid max-w-md gap-2 rounded-xl border border-border bg-muted/30 p-4 text-left text-sm">
              <Row label="Package" value={pkg ? `${pkg.name} · ${ghs(pkg.price_ghs)}` : "—"} />
              <Row label="Credits" value={pkg ? `${pkg.credits} credits` : "—"} />
              <Row
                label="Verdicts / scan"
                value={pkg ? String(pkg.max_verdicts) : "—"}
              />
              <Row label="Method" value={method} />
              <Row label="MoMo name" value={senderName} />
              <Row label="Reference" value={reference} />
              <Row label="Status" value="Pending approval" />
            </dl>

            <Button
              className="mt-6"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Done
            </Button>
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
