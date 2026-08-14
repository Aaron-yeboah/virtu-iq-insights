import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  adminApplicationsQuery,
  adminCreditOverviewQuery,
  adminMemberListQuery,
  adminMembersQuery,
  adminPackagesQuery,
  adminPaymentsQuery,
  adminStatsQuery,
  auditLogsQuery,
  ghs,
  rolesQuery,
  type PackageRow,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Virtu-IQ" },
      { name: "description", content: "Review Virtu-IQ payments, partner applications, members and audit logs." },
      { property: "og:title", content: "Admin Console — Virtu-IQ" },
      { property: "og:description", content: "Approve payments and manage the Virtu-IQ platform." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: roles, isLoading: rolesLoading } = useQuery(rolesQuery(user.id));
  const isAdmin = (roles ?? []).includes("admin");

  const { data: stats } = useQuery({ ...adminStatsQuery(), enabled: isAdmin });
  const { data: payments } = useQuery({ ...adminPaymentsQuery(), enabled: isAdmin });
  const { data: applications } = useQuery({ ...adminApplicationsQuery(), enabled: isAdmin });
  const { data: members } = useQuery({ ...adminMembersQuery(), enabled: isAdmin });
  const { data: logs } = useQuery({ ...auditLogsQuery(), enabled: isAdmin });

  const reviewPayment = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc("review_payment", {
        _payment_id: id,
        _approve: approve,
        _note: approve ? "Payment verified" : "Reference could not be verified",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Payment reviewed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reviewApplication = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc("review_partner_application", {
        _application_id: id,
        _approve: approve,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Application reviewed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rolesLoading) return <p className="text-sm text-muted-foreground">Checking access…</p>;
  if (!isAdmin) {
    return (
      <PageHeader
        title="Admin only"
        description="You don't have permission to view the admin console."
      />
    );
  }

  return (
    <>
      <PageHeader title="Admin console" description="Review payments, partners and platform activity." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Members" value={String(stats?.members ?? 0)} />
        <Stat label="Analyses" value={String(stats?.analyses ?? 0)} />
        <Stat label="Pending payments" value={String(stats?.pending_payments ?? 0)} />
        <Stat label="Pending partners" value={String(stats?.pending_partners ?? 0)} />
        <Stat label="Revenue" value={ghs(stats?.revenue_ghs ?? 0)} />
      </div>

      <Tabs defaultValue="payments" className="mt-8">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="packages">Packages & credits</TabsTrigger>
          <TabsTrigger value="manage-partners">Manage partners</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-4">
          <MonetisationManager />
        </TabsContent>

        <TabsContent value="manage-partners" className="mt-4">
          <PartnerManager />
        </TabsContent>

        <TabsContent value="payments" className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {(payments ?? []).length === 0 && <p className="p-5 text-sm text-muted-foreground">No payments yet.</p>}
          {(payments ?? []).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {ghs(p.amount_ghs)} · {p.credits} credits · {p.method}
                </p>
                <p className="text-xs text-muted-foreground">Ref: {p.reference}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleString()} · user {p.user_id.slice(0, 8)}
                </p>
              </div>
              {p.status === "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" disabled={reviewPayment.isPending} onClick={() => reviewPayment.mutate({ id: p.id, approve: true })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={reviewPayment.isPending} onClick={() => reviewPayment.mutate({ id: p.id, approve: false })}>
                    Reject
                  </Button>
                </div>
              ) : (
                <Badge variant={p.status === "approved" ? "default" : "destructive"}>{p.status}</Badge>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="partners" className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {(applications ?? []).length === 0 && <p className="p-5 text-sm text-muted-foreground">No applications yet.</p>}
          {(applications ?? []).map((a) => (
            <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 max-w-xl">
                <p className="text-sm font-medium text-foreground">user {a.user_id.slice(0, 8)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.audience}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Payout: {a.payout_method} · {a.payout_details}
                </p>
              </div>
              {a.status === "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" disabled={reviewApplication.isPending} onClick={() => reviewApplication.mutate({ id: a.id, approve: true })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={reviewApplication.isPending} onClick={() => reviewApplication.mutate({ id: a.id, approve: false })}>
                    Reject
                  </Button>
                </div>
              ) : (
                <Badge variant={a.status === "approved" ? "default" : "destructive"}>{a.status}</Badge>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="members" className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {(members ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{m.full_name ?? m.email}</p>
                <p className="truncate text-xs text-muted-foreground">{m.email} · {m.referral_code}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">{m.credits} credits</span>
                <CreditAdjuster userId={m.id} label={m.full_name ?? m.email ?? "member"} />
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="audit" className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {(logs ?? []).length === 0 && <p className="p-5 text-sm text-muted-foreground">No admin activity recorded yet.</p>}
          {(logs ?? []).map((l) => (
            <div key={l.id} className="p-4">
              <p className="text-sm font-medium text-foreground">{l.action}</p>
              <p className="text-xs text-muted-foreground">
                {l.entity} · {new Date(l.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

type MemberRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  credits: number;
  referral_code: string;
  created_at: string;
  is_partner: boolean;
  referred_by: string | null;
  referrer_name: string | null;
  spent_ghs: number;
  referral_count: number;
};

function PartnerManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [onlyPartners, setOnlyPartners] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>("");

  const { data, isFetching } = useQuery(
    adminMemberListQuery({ search, onlyPartners, partnerId }),
  );
  const rows = (data ?? []) as MemberRow[];

  const setPartner = useMutation({
    mutationFn: async ({ id, make }: { id: string; make: boolean }) => {
      const { error } = await supabase.rpc("admin_set_partner", { _user_id: id, _make: make });
      if (error) throw new Error(error.message);
    },
    onSuccess: async (_d, vars) => {
      await queryClient.invalidateQueries();
      toast.success(vars.make ? "Partner added" : "Partner removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or referral code"
          aria-label="Search members"
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={!onlyPartners && !partnerId ? "default" : "outline"}
            onClick={() => {
              setOnlyPartners(false);
              setPartnerId(null);
            }}
          >
            All members
          </Button>
          <Button
            type="button"
            size="sm"
            variant={onlyPartners ? "default" : "outline"}
            onClick={() => {
              setOnlyPartners(true);
              setPartnerId(null);
            }}
          >
            Partners only
          </Button>
          {partnerId && (
            <Button type="button" size="sm" variant="secondary" onClick={() => setPartnerId(null)}>
              Clear: referred by {partnerName}
            </Button>
          )}
        </div>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">
            {isFetching ? "Loading members…" : "No members match this filter."}
          </p>
        )}
        {rows.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                {m.full_name ?? m.email}
                {m.is_partner && <Badge>Partner</Badge>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {m.email} · code {m.referral_code} · spent {ghs(m.spent_ghs)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {m.is_partner
                  ? `${m.referral_count} referred member${m.referral_count === 1 ? "" : "s"}`
                  : m.referrer_name
                    ? `Joined via ${m.referrer_name}`
                    : "Direct signup"}
              </p>
            </div>
            <div className="flex gap-2">
              {m.is_partner && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPartnerId(m.id);
                    setPartnerName(m.full_name ?? m.email ?? "partner");
                    setOnlyPartners(false);
                    setSearch("");
                  }}
                >
                  View members
                </Button>
              )}
              <Button
                size="sm"
                variant={m.is_partner ? "destructive" : "default"}
                disabled={setPartner.isPending}
                onClick={() => setPartner.mutate({ id: m.id, make: !m.is_partner })}
              >
                {m.is_partner ? "Remove partner" : "Add partner"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreditAdjuster({ userId, label }: { userId: string; label: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("5");
  const [reason, setReason] = useState("");

  const adjust = useMutation({
    mutationFn: async (sign: 1 | -1) => {
      const delta = sign * Math.abs(Number(amount));
      if (!Number.isFinite(delta) || delta === 0) throw new Error("Enter a credit amount.");
      const note = reason.trim();
      const { error } = await supabase.rpc("admin_adjust_credits", {
        _user_id: userId,
        _delta: Math.trunc(delta),
        ...(note ? { _reason: note } : {}),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setReason("");
      setOpen(false);
      await queryClient.invalidateQueries();
      toast.success("Credits updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Credits
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust credits</DialogTitle>
          <DialogDescription>Grant or remove prediction credits for {label}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor={`amt-${userId}`}>Credits</Label>
            <Input
              id={`amt-${userId}`}
              type="number"
              min={1}
              max={10000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`why-${userId}`}>Reason (shown in their ledger)</Label>
            <Input
              id={`why-${userId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Goodwill top-up"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button disabled={adjust.isPending} onClick={() => adjust.mutate(1)}>
            Add credits
          </Button>
          <Button variant="destructive" disabled={adjust.isPending} onClick={() => adjust.mutate(-1)}>
            Remove credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PackageDraft = {
  id: string | null;
  name: string;
  slug: string;
  price_ghs: string;
  credits: string;
  perks: string;
  is_active: boolean;
  sort_order: string;
};

const emptyDraft: PackageDraft = {
  id: null,
  name: "",
  slug: "",
  price_ghs: "",
  credits: "",
  perks: "",
  is_active: true,
  sort_order: "0",
};

function MonetisationManager() {
  const queryClient = useQueryClient();
  const { data: overview } = useQuery(adminCreditOverviewQuery());
  const { data: packages } = useQuery(adminPackagesQuery());
  const [draft, setDraft] = useState<PackageDraft | null>(null);

  const save = useMutation({
    mutationFn: async (d: PackageDraft) => {
      const perks = d.perks
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);
      const { error } = await supabase.rpc("admin_upsert_package", {
        ...(d.id ? { _id: d.id } : {}),
        _name: d.name,
        _slug: d.slug.trim() || d.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        _price_ghs: Number(d.price_ghs),
        _credits: Math.trunc(Number(d.credits)),
        _perks: perks,
        _is_active: d.is_active,
        _sort_order: Math.trunc(Number(d.sort_order) || 0),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setDraft(null);
      await queryClient.invalidateQueries();
      toast.success("Package saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (p: PackageRow) => {
      const { error } = await supabase.rpc("admin_upsert_package", {
        _id: p.id,
        _name: p.name,
        _slug: p.slug,
        _price_ghs: Number(p.price_ghs),
        _credits: p.credits,
        _perks: (p.perks as string[]) ?? [],
        _is_active: !p.is_active,
        _sort_order: p.sort_order,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Package visibility updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_delete_package", { _id: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Package removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Credits outstanding" value={String(overview?.credits_outstanding ?? 0)} />
        <Stat label="Credits sold" value={String(overview?.credits_sold ?? 0)} />
        <Stat label="Credits used" value={String(overview?.credits_spent ?? 0)} />
        <Stat label="Revenue" value={ghs(overview?.revenue_ghs ?? 0)} />
        <Stat label="Active packages" value={String(overview?.active_packages ?? 0)} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Packages</h3>
        <Button size="sm" onClick={() => setDraft({ ...emptyDraft })}>
          New package
        </Button>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {(packages ?? []).length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">No packages yet — create your first one.</p>
        )}
        {(packages ?? []).map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                {p.name}
                {!p.is_active && <Badge variant="secondary">Hidden</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">
                {ghs(p.price_ghs)} · {p.credits} credits · slug {p.slug} · order {p.sort_order}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 pr-2">
                <Switch
                  checked={p.is_active}
                  onCheckedChange={() => toggle.mutate(p)}
                  aria-label={`Toggle ${p.name}`}
                />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    price_ghs: String(p.price_ghs),
                    credits: String(p.credits),
                    perks: (((p.perks as string[]) ?? []) as string[]).join("\n"),
                    is_active: p.is_active,
                    sort_order: String(p.sort_order),
                  })
                }
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => remove.mutate(p.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit package" : "New package"}</DialogTitle>
            <DialogDescription>
              Set the price, credits and perks members see on the credits page.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(draft);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pkg-name">Name</Label>
                  <Input
                    id="pkg-name"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-slug">Slug</Label>
                  <Input
                    id="pkg-slug"
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                    placeholder="starter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-price">Price (GHS)</Label>
                  <Input
                    id="pkg-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.price_ghs}
                    onChange={(e) => setDraft({ ...draft, price_ghs: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-credits">Credits</Label>
                  <Input
                    id="pkg-credits"
                    type="number"
                    min={1}
                    value={draft.credits}
                    onChange={(e) => setDraft({ ...draft, credits: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-order">Display order</Label>
                  <Input
                    id="pkg-order"
                    type="number"
                    value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
                  />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Switch
                    id="pkg-active"
                    checked={draft.is_active}
                    onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                  />
                  <Label htmlFor="pkg-active">Visible to members</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-perks">Perks (one per line)</Label>
                <Textarea
                  id="pkg-perks"
                  rows={4}
                  value={draft.perks}
                  onChange={(e) => setDraft({ ...draft, perks: e.target.value })}
                  placeholder={"Priority verdicts\nEmail support"}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={save.isPending}>
                  Save package
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
