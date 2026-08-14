import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Copy, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogoFull, LogoSymbol } from "@/components/brand/Logo";
import { usePaymentRealtime } from "@/hooks/usePaymentRealtime";
import { supabase } from "@/integrations/supabase/client";
import { ghs, paymentSettingsQuery, profileQuery, registrationPaymentQuery } from "@/lib/data";

const METHODS = ["MTN MoMo", "Telecel Cash", "AirtelTigo Money", "Bank transfer"] as const;

export const Route = createFileRoute("/_authenticated/registration")({
  head: () => ({
    meta: [
      { title: "Registration Fee — Virtu-IQ" },
      {
        name: "description",
        content:
          "Complete your one-time Virtu-IQ registration fee to unlock credits and instant virtual football verdicts.",
      },
      { property: "og:title", content: "Registration Fee — Virtu-IQ" },
      { property: "og:description", content: "Pay your one-time Virtu-IQ registration fee to activate your account." },
    ],
  }),
  component: RegistrationFeePage,
});

function RegistrationFeePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: settings } = useQuery(paymentSettingsQuery());
  const { data: profile } = useQuery({ ...profileQuery(user.id), refetchInterval: 3000 });
  const { data: pending } = useQuery({ ...registrationPaymentQuery(user.id), refetchInterval: 3000 });
  usePaymentRealtime(user.id);

  const [method, setMethod] = useState<string>(METHODS[0]);
  const [senderName, setSenderName] = useState("");
  const [reference, setReference] = useState("");

  const fee = Number(settings?.registration_fee_ghs ?? 50);
  const approved = !!pending && pending.status === "approved";
  const submitted = !!pending && (pending.status === "pending" || approved);
  const rejected = !!pending && pending.status === "rejected";

  useEffect(() => {
    if (!profile?.registration_paid) return;
    toast.success("Registration approved — welcome to Virtu-IQ!");
    const timer = window.setTimeout(() => {
      void navigate({ to: "/credits", replace: true });
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [profile?.registration_paid, navigate]);

  const submit = useMutation({
    mutationFn: async () => {
      const name = senderName.trim();
      if (name.length < 2 || name.length > 80) {
        throw new Error("Enter the MoMo name on the account you paid from (2-80 characters).");
      }
      const ref = reference.trim();
      if (ref.length > 80) throw new Error("Transaction reference is too long.");
      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        amount_ghs: fee,
        credits: 0,
        kind: "registration",
        method,
        sender_name: name,
        reference: ref || "Not provided",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["registration-payment", user.id] });
      toast.success("Submitted — an admin will approve shortly.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="mx-auto w-full max-w-2xl">
      <div className="flex justify-center">
        <LogoFull className="h-9" />
      </div>

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-[#1D4ED8] p-6 text-primary-foreground">
        <LogoSymbol className="pointer-events-none absolute -right-5 -bottom-8 h-40 w-auto opacity-[0.15]" aria-hidden />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
            <ShieldCheck className="size-3.5" /> One-time activation
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Registration fee</h1>
          <p className="mt-1.5 max-w-md text-sm opacity-90">
            Pay {ghs(fee)} once to activate your Virtu-IQ account. Once an admin confirms your payment
            your credits page unlocks instantly.
          </p>
          <p className="mt-4 text-4xl font-extrabold tracking-tight">{ghs(fee)}</p>
        </div>
      </div>

      {submitted ? (
        <div className="animate-verdict relative mt-5 overflow-hidden rounded-2xl border border-border bg-card p-6 text-center">
          <LogoSymbol className="pointer-events-none absolute -right-6 -bottom-8 h-40 w-auto opacity-[0.06]" aria-hidden />
          <span className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {approved ? <Check className="relative size-7" /> : <Clock className="relative size-7" />}
          </span>
          <h2 className="relative mt-4 text-lg font-bold text-foreground">
            {approved ? "Registration approved" : "Awaiting admin approval"}
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {approved
              ? "You are all set — taking you to your credits now…"
              : `We are verifying your ${ghs(pending.amount_ghs)} payment against the MoMo name “${pending.sender_name ?? "—"}”. This page unlocks automatically once approved — no reload needed.`}
          </p>
          <dl className="relative mx-auto mt-6 grid max-w-sm gap-2 rounded-xl border border-border bg-muted/30 p-4 text-left text-sm">
            <Row label="Amount" value={ghs(pending.amount_ghs)} />
            <Row label="Method" value={pending.method} />
            <Row label="MoMo name" value={pending.sender_name ?? "—"} />
            <Row label="Reference" value={pending.reference} />
            <Row label="Status" value={approved ? "Approved" : "Pending approval"} />
          </dl>
        </div>
      ) : (
        <form
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          {rejected && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Your previous submission was rejected{pending.admin_note ? `: ${pending.admin_note}` : "."} Please
              pay again and resubmit your MoMo details.
            </p>
          )}

          <div className="relative grid gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5">
            <LogoSymbol className="pointer-events-none absolute -right-4 -bottom-6 h-28 w-auto opacity-[0.06]" aria-hidden />
            <div className="relative flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Pay to ({settings?.network ?? "MoMo"})</p>
                <p className="text-lg font-bold tracking-tight text-foreground">{settings?.momo_number ?? "—"}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(settings?.momo_number ?? "");
                  toast.success("Number copied");
                }}
              >
                <Copy className="mr-1 size-3.5" /> Copy
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
              <Label htmlFor="reference">Transaction reference (optional)</Label>
              <Input
                id="reference"
                value={reference}
                maxLength={80}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. MP2401.1234.567890"
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={submit.isPending}>
            {submit.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
            I have paid {ghs(fee)}
          </Button>
        </form>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
