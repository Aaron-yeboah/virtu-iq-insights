import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { creditHistoryQuery, ghs, packagesQuery, paymentsQuery, profileQuery } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/credits")({
  head: () => ({
    meta: [
      { title: "Credits & Packages — Virtu-IQ" },
      { name: "description", content: "Top up your Virtu-IQ analysis credits with the Starter, Plus or Premium package and track your credit ledger." },
      { property: "og:title", content: "Credits & Packages — Virtu-IQ" },
      { property: "og:description", content: "Buy analysis credits and follow your payment approvals." },
    ],
  }),
  component: CreditsPage,
});

const METHODS = ["MTN MoMo", "Telecel Cash", "AirtelTigo Money", "Bank transfer"];

function CreditsPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user.id));
  const { data: packages } = useQuery(packagesQuery());
  const { data: payments } = useQuery(paymentsQuery(user.id));
  const { data: history } = useQuery(creditHistoryQuery(user.id));

  const [selected, setSelected] = useState<string | null>(null);
  const [method, setMethod] = useState(METHODS[0]!);
  const [reference, setReference] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const pkg = (packages ?? []).find((p) => p.id === selected);
      if (!pkg) throw new Error("Choose a package first.");
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
        reference: ref,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setReference("");
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ["payments", user.id] });
      toast.success("Payment submitted — an admin will review it shortly.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Credits & packages"
        description={`You have ${profile?.credits ?? 0} credits. 1 credit = 1 screenshot analysis.`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {(packages ?? []).map((pkg) => {
          const active = selected === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelected(pkg.id)}
              className={cn(
                "rounded-xl border-2 bg-card p-6 text-left transition-all",
                active ? "border-primary shadow-[var(--shadow-soft)]" : "border-border hover:border-primary/50",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{pkg.name}</h2>
                {pkg.slug === "plus" && <Badge>Popular</Badge>}
              </div>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
                {ghs(pkg.price_ghs)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{pkg.credits} analysis credits</p>
              <ul className="mt-4 space-y-2">
                {((pkg.perks as string[]) ?? []).map((perk) => (
                  <li key={perk} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <section className="mt-8 max-w-2xl rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Submit your payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay with your chosen method, then submit the reference here. Credits are added once an
          admin approves the payment.
        </p>
        <form
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
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
          <Button type="submit" disabled={!selected || submit.isPending}>
            {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {selected ? "Submit payment for review" : "Select a package above"}
          </Button>
        </form>
      </section>

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
