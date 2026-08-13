import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  commissionsQuery,
  ghs,
  partnerApplicationQuery,
  profileQuery,
  referralsQuery,
  rolesQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/partner")({
  head: () => ({
    meta: [
      { title: "Partner Program — Virtu-IQ" },
      { name: "description", content: "Join the Virtu-IQ partner program, share your referral link and earn 10% commission on every approved package." },
      { property: "og:title", content: "Partner Program — Virtu-IQ" },
      { property: "og:description", content: "Earn 10% commission by referring members to Virtu-IQ." },
    ],
  }),
  component: PartnerPage,
});

function PartnerPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user.id));
  const { data: application, isLoading } = useQuery(partnerApplicationQuery(user.id));
  const { data: roles } = useQuery(rolesQuery(user.id));
  const isPartner = (roles ?? []).includes("partner") && application?.status === "approved";
  const { data: commissions } = useQuery({ ...commissionsQuery(user.id), enabled: isPartner });
  const { data: referrals } = useQuery({ ...referralsQuery(user.id), enabled: isPartner });

  const [audience, setAudience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");

  const apply = useMutation({
    mutationFn: async () => {
      if (audience.trim().length < 10) throw new Error("Tell us a bit more about your audience.");
      if (motivation.trim().length < 10) throw new Error("Tell us why you want to partner with us.");
      if (payoutMethod.trim().length < 3) throw new Error("Enter a payout method.");
      if (payoutDetails.trim().length < 5) throw new Error("Enter your payout details.");
      const { error } = await supabase.from("partner_applications").insert({
        user_id: user.id,
        audience: audience.trim().slice(0, 500),
        motivation: motivation.trim().slice(0, 800),
        payout_method: payoutMethod.trim().slice(0, 60),
        payout_details: payoutDetails.trim().slice(0, 120),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["partner-application", user.id] });
      toast.success("Application submitted for review.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const referralLink =
    isPartner && typeof window !== "undefined" && profile?.referral_code
      ? `${window.location.origin}/register?ref=${profile.referral_code}`
      : "";
  const earned = (commissions ?? []).reduce((sum, c) => sum + Number(c.amount_ghs), 0);

  return (
    <>
      <PageHeader
        title="Partner program"
        description="Refer members to Virtu-IQ and earn 10% of every approved package payment."
      />

      {isPartner && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Members referred" value={String(referrals ?? 0)} />
            <Stat label="Commissions earned" value={ghs(earned)} />
            <Stat label="Payouts recorded" value={String((commissions ?? []).length)} />
          </div>

          <section className="mt-6 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Your referral link</h2>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={referralLink} aria-label="Referral link" />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(referralLink);
                  toast.success("Referral link copied");
                }}
              >
                <Copy className="mr-2 size-4" /> Copy
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Referral code: <span className="font-semibold">{profile?.referral_code}</span>
            </p>
          </section>
        </>
      )}

      {!isPartner && (
        <section className="rounded-xl border border-border bg-secondary/50 p-6">
          <h2 className="text-base font-semibold text-foreground">Referral link locked</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Referral links and commissions unlock once an admin verifies your partner application.
          </p>
        </section>
      )}

      {!isLoading && !application && (
        <section className="mt-6 max-w-2xl rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Apply to become a partner</h2>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              apply.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="audience">Who is your audience?</Label>
              <Textarea id="audience" maxLength={500} value={audience} onChange={(e) => setAudience(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivation">Why do you want to partner with Virtu-IQ?</Label>
              <Textarea id="motivation" maxLength={800} value={motivation} onChange={(e) => setMotivation(e.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payout-method">Payout method</Label>
                <Input id="payout-method" maxLength={60} placeholder="MTN MoMo" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout-details">Payout details</Label>
                <Input id="payout-details" maxLength={120} placeholder="024 000 0000" value={payoutDetails} onChange={(e) => setPayoutDetails(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" disabled={apply.isPending}>
              {apply.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit application
            </Button>
          </form>
        </section>
      )}

      {application && (
        <section className="mt-6 max-w-2xl rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your application</h2>
            <Badge
              variant={
                application.status === "approved" ? "default" : application.status === "rejected" ? "destructive" : "secondary"
              }
            >
              {application.status}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{application.audience}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Payout: {application.payout_method} · {application.payout_details}
          </p>
          {application.admin_note && (
            <p className="mt-2 text-xs text-muted-foreground">Admin note: {application.admin_note}</p>
          )}
        </section>
      )}

      {isPartner && (
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Commission history</h2>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {(commissions ?? []).length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">
              No commissions yet. They appear when a referred member's payment is approved.
            </p>
          )}
          {(commissions ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4">
              <p className="text-sm text-muted-foreground">
                {new Date(c.created_at).toLocaleString()}
              </p>
              <span className="text-sm font-semibold text-primary">{ghs(c.amount_ghs)}</span>
            </div>
          ))}
        </div>
      </section>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
