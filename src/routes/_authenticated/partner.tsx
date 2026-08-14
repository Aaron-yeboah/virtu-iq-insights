import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Handshake, Link2, TrendingUp, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/AppShell";
import { LogoSymbol } from "@/components/brand/Logo";
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

      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary via-primary to-[#1D4ED8] p-6 text-primary-foreground shadow-[var(--shadow-soft)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-black/20 blur-3xl" />
        <LogoSymbol
          className="pointer-events-none absolute -right-4 -bottom-8 h-52 w-auto opacity-[0.14] sm:h-60"
          aria-hidden
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <Handshake className="size-3.5" /> Verified partner
          </span>
          <p className="mt-5 text-sm opacity-85">Commissions earned</p>
          <p className="mt-1 text-5xl font-extrabold leading-none tracking-tight">
            {ghs(stats?.commissions_ghs ?? 0)}
          </p>
          <p className="mt-3 text-sm opacity-85">
            10% of every approved payment from members you bring to Virtu-IQ.
          </p>

          <div className="mt-7 rounded-xl bg-white/12 p-4 backdrop-blur-[2px]">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-90">
              <Link2 className="size-3.5" /> Your referral link
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                value={referralLink}
                aria-label="Referral link"
                className="border-white/25 bg-white/15 text-primary-foreground placeholder:text-primary-foreground/60"
              />
              <Button
                type="button"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => {
                  void navigator.clipboard.writeText(referralLink);
                  toast.success("Referral link copied");
                }}
              >
                <Copy className="mr-2 size-4" /> Copy
              </Button>
            </div>
            <p className="mt-2 text-xs opacity-85">
              Referral code: <span className="font-semibold">{profile?.referral_code}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
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

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Commission history</h2>
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-card">
          <LogoSymbol
            className="pointer-events-none absolute -right-6 -bottom-8 h-40 w-auto opacity-[0.05]"
            aria-hidden
          />
          <div className="relative divide-y divide-border">
            {(commissions ?? []).length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">
                No commissions yet. They appear when a referred member's payment is approved.
              </p>
            )}
            {(commissions ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-4">
                <p className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                <span className="text-sm font-semibold text-primary">{ghs(c.amount_ghs)}</span>
              </div>
            ))}
          </div>
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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <LogoSymbol
        className="pointer-events-none absolute -right-4 -bottom-6 h-28 w-auto opacity-[0.06]"
        aria-hidden
      />
      <div className="relative flex min-w-0 items-center gap-2 text-primary">
        {icon}
        <p className="truncate text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="relative mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="relative mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
