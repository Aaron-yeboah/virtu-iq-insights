import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, TrendingUp, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/AppShell";
import { commissionsQuery, ghs, partnerStatsQuery, profileQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/partner")({
  head: () => ({
    meta: [
      { title: "Partner Hub — Virtu-IQ" },
      {
        name: "description",
        content:
          "Track registrations from your Virtu-IQ referral code, revenue from your members and commissions earned.",
      },
      { property: "og:title", content: "Partner Hub — Virtu-IQ" },
      { property: "og:description", content: "Your Virtu-IQ referral performance at a glance." },
    ],
  }),
  component: PartnerPage,
});

function PartnerPage() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery(profileQuery(user.id));
  const { data: stats } = useQuery(partnerStatsQuery(user.id));
  const { data: commissions } = useQuery(commissionsQuery(user.id));

  const referralLink =
    typeof window !== "undefined" && profile?.referral_code
      ? `${window.location.origin}/register?ref=${profile.referral_code}`
      : "";

  return (
    <>
      <PageHeader
        title="Partner hub"
        description="Everything you need as a Virtu-IQ partner — your link, your members and your earnings."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Registrations"
          value={String(stats?.registrations ?? 0)}
          hint="Members who signed up with your code"
          icon={<Users className="size-4" />}
        />
        <Stat
          label="Revenue from your members"
          value={ghs(stats?.revenue_ghs ?? 0)}
          hint="Approved package payments"
          icon={<TrendingUp className="size-4" />}
        />
        <Stat
          label="Commissions made"
          value={ghs(stats?.commissions_ghs ?? 0)}
          hint="10% of every approved payment"
          icon={<Wallet className="size-4" />}
        />
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Your referral link</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every member who registers through this link is permanently tied to you.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
              <p className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
              <span className="text-sm font-semibold text-primary">{ghs(c.amount_ghs)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
