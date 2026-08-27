import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { LogoSymbol } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { deleteMember, explodePlatformData } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Copy,
  Mail,
  Percent,
  Phone,
  Search,
  Sliders,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  adminCreditOverviewQuery,
  adminMemberListQuery,
  adminPackagesQuery,
  adminPartnerApplicationsQuery,
  adminPartnerListQuery,
  adminPartnerPayoutsQuery,
  adminPaymentsQuery,
  adminStatsQuery,
  auditLogsQuery,
  ghs,
  paymentSettingsQuery,
  rolesQuery,
  type AdminApplicationRow,
  type AdminPartnerRow,
  type PackageRow,
  type PartnerPayoutRow,
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

/**
 * Realtime WebSockets hook for the Admin Console:
 * Instant updates for payments, members, partners, and revenue stats without reloading.
 */
function useAdminRealtime(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("admin-realtime-websocket")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-members"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-partner-payouts"] });
          void queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_applications" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["admin-partner-applications"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["admin-members"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_commissions" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["admin-partner-payouts"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}

function AdminPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: roles, isLoading: rolesLoading } = useQuery(rolesQuery(user.id));
  const isAdmin = (roles ?? []).includes("admin");

  // Subscribe to real-time WebSockets when admin access is granted
  useAdminRealtime(isAdmin);

  const { data: stats } = useQuery({ ...adminStatsQuery(), enabled: isAdmin });
  const { data: payments } = useQuery({ ...adminPaymentsQuery(), enabled: isAdmin });
  const { data: members } = useQuery({ ...adminMemberListQuery({}), enabled: isAdmin });
  const { data: logs } = useQuery({ ...auditLogsQuery(), enabled: isAdmin });
  const { data: settings } = useQuery({ ...paymentSettingsQuery(), enabled: isAdmin });

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-payments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-members"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-partner-payouts"] }),
      ]);
      toast.success("Payment reviewed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const devRate = Number(settings?.developer_commission_rate ?? 65);
  const devCommission = ((stats?.revenue_ghs ?? 0) * devRate) / 100;

  const adminRate = Number(settings?.admin_commission_rate ?? 25);
  const adminCommission = ((stats?.revenue_ghs ?? 0) * adminRate) / 100;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRevenue = (payments ?? [])
    .filter((p) => p.status === "approved" && (p.created_at || "").slice(0, 10) === todayStr)
    .reduce((acc, p) => acc + Number(p.amount_ghs || 0), 0);

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
      <PageHeader title="Admin console" description="Review payments, partners, commission settings and platform activity." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-8">
        <Stat label="Total Revenue" value={ghs(stats?.revenue_ghs ?? 0)} highlight />
        <Stat label="Today's Revenue" value={ghs(todayRevenue)} highlight />
        <Stat label={`Dev Commission (${devRate}%)`} value={ghs(devCommission)} highlight />
        <Stat label={`Admin Commission (${adminRate}%)`} value={ghs(adminCommission)} highlight />
        <Stat label="Partners" value={String(stats?.partners ?? 0)} />
        <Stat label="Members" value={String(stats?.members ?? 0)} />
        <Stat label="Analyses" value={String(stats?.analyses ?? 0)} />
        <Stat label="Pending payments" value={String(stats?.pending_payments ?? 0)} />
      </div>

      <Tabs defaultValue="payments" className="mt-8">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="w-max min-w-full justify-start gap-1">
            <TabsTrigger value="payments" className="whitespace-nowrap">Payments</TabsTrigger>
            <TabsTrigger value="settings" className="whitespace-nowrap">Settings</TabsTrigger>
            <TabsTrigger value="packages" className="whitespace-nowrap">Packages &amp; credits</TabsTrigger>
            <TabsTrigger value="partners" className="whitespace-nowrap">Partners</TabsTrigger>
            <TabsTrigger value="manage-partners" className="whitespace-nowrap">Manage partners</TabsTrigger>
            <TabsTrigger value="members" className="whitespace-nowrap">Members</TabsTrigger>
            <TabsTrigger value="audit" className="whitespace-nowrap">Audit log</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="packages" className="mt-4">
          <MonetisationManager />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <AdminSettingsManager />
        </TabsContent>

        <TabsContent value="manage-partners" className="mt-4">
          <PartnerManager />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsList payments={payments ?? []} reviewPayment={reviewPayment} />
        </TabsContent>

        <TabsContent value="partners" className="mt-4">
          <PartnerPayouts />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersList members={members ?? []} currentUserId={user.id} />
        </TabsContent>

        <TabsContent value="audit" className="mt-4 space-y-4">
          <ExplodeCard />
          <AuditLogList logs={logs ?? []} />
        </TabsContent>
      </Tabs>
    </>
  );
}

type AuditLog = { id: string; action: string; entity: string; created_at: string };

function RemoveMember({ userId, label }: { userId: string; label: string }) {
  const queryClient = useQueryClient();
  const removeFn = useServerFn(deleteMember);
  const remove = useMutation({
    mutationFn: () => removeFn({ data: { userId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Member removed");
    },
    onError: (e: Error) =>
      toast.error(
        e.message === "FORBIDDEN"
          ? "Admins only"
          : e.message === "CANNOT_REMOVE_DEFAULT_ADMIN"
            ? "The default admin cannot be removed"
            : e.message,
      ),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="outline" aria-label={`Remove ${label}`} className="size-8">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes the account and all of its analyses, payments and credits. To get access
            again they must register a new account, sign in and pay the registration fee for your
            approval.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={remove.isPending}
            onClick={(e) => {
              e.preventDefault();
              remove.mutate();
            }}
          >
            Remove member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AuditLogList({ logs }: { logs: AuditLog[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? logs : logs.slice(0, 12);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {logs.length === 0 && <p className="p-5 text-sm text-muted-foreground">No admin activity recorded yet.</p>}
      <div className="divide-y divide-border">
        {visible.map((l) => (
          <div key={l.id} className="p-4">
            <p className="text-sm font-medium text-foreground">{l.action}</p>
            <p className="text-xs text-muted-foreground">
              {l.entity} · {new Date(l.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      {logs.length > 12 && (
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-center gap-1.5 font-medium"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp className="size-4" /> Collapse (show top 12)
              </>
            ) : (
              <>
                <ChevronDown className="size-4" /> Show all {logs.length} logs ({logs.length - 12} more)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

type AdminPaymentItem = {
  id: string;
  user_id: string;
  amount_ghs: number;
  credits: number;
  kind: string;
  method: string;
  reference: string;
  sender_name: string | null;
  status: string;
  admin_note?: string | null;
  created_at: string;
};

function PaymentsList({
  payments,
  reviewPayment,
}: {
  payments: AdminPaymentItem[];
  reviewPayment: { isPending: boolean; mutate: (vars: { id: string; approve: boolean }) => void };
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? payments : payments.slice(0, 12);

  return (
    <div className="space-y-3">
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {payments.length === 0 && <p className="p-5 text-sm text-muted-foreground">No payments yet.</p>}
        {visible.map((p) => (
          <div key={p.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {ghs(p.amount_ghs)} ·{" "}
                {p.kind === "registration" ? "Registration fee" : `${p.credits} credits`} · {p.method}
              </p>
              <p className="truncate text-xs text-muted-foreground">Ref: {p.reference}</p>
              <p className="truncate text-xs text-muted-foreground">MoMo name: {p.sender_name ?? "—"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {new Date(p.created_at).toLocaleString()} · user {p.user_id.slice(0, 8)}
              </p>
            </div>
            {p.status === "pending" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={reviewPayment.isPending}
                  onClick={() => reviewPayment.mutate({ id: p.id, approve: true })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={reviewPayment.isPending}
                  onClick={() => reviewPayment.mutate({ id: p.id, approve: false })}
                >
                  Reject
                </Button>
              </div>
            ) : (
              <Badge className="w-fit" variant={p.status === "approved" ? "default" : "destructive"}>
                {p.status}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {payments.length > 12 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5"
          >
            {expanded ? (
              <>
                <ChevronUp className="size-4" /> Show less (top 12)
              </>
            ) : (
              <>
                <ChevronDown className="size-4" /> Show all {payments.length} payments ({payments.length - 12} more)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function MembersList({ members, currentUserId }: { members: MemberRow[]; currentUserId: string }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = members.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.full_name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.phone || "").toLowerCase().includes(q) ||
      (m.referral_code || "").toLowerCase().includes(q)
    );
  });

  const visible = expanded ? filtered : filtered.slice(0, 12);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name, email, phone or referral code..."
            aria-label="Search members"
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{visible.length}</span> of{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span> members
        </p>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {search ? "No members match your search." : "No registered members yet."}
          </p>
        )}
        {visible.map((m) => {
          const nameDisplay = m.full_name || m.email || "Member";
          const initials = nameDisplay
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <div key={m.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                  {initials}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {m.full_name || m.email}
                    </span>
                    {m.is_admin && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                    {m.is_partner && <Badge className="text-[10px]">Partner</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="size-3 text-muted-foreground/70" /> {m.email}
                    </span>
                    {m.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3 text-muted-foreground/70" /> {m.phone}
                      </span>
                    )}
                    <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[11px] font-mono font-medium">
                      Code: {m.referral_code}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Coins className="size-3 text-primary" /> {m.credits} credit{m.credits === 1 ? "" : "s"}
                    </span>
                    <span>·</span>
                    <span>Spent: <strong className="text-foreground">{ghs(m.spent_ghs)}</strong></span>
                    <span>·</span>
                    <span>Joined: {new Date(m.created_at).toLocaleDateString()}</span>
                    {m.last_sign_in_at && (
                      <>
                        <span>·</span>
                        <span>Active: {new Date(m.last_sign_in_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:self-center">
                <CreditAdjuster userId={m.id} label={m.full_name ?? m.email ?? "member"} />
                {m.id !== currentUserId && (
                  <RemoveMember userId={m.id} label={m.full_name ?? m.email ?? "this member"} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 12 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5"
          >
            {expanded ? (
              <>
                <ChevronUp className="size-4" /> Show less (top 12)
              </>
            ) : (
              <>
                <ChevronDown className="size-4" /> Show all {filtered.length} members ({filtered.length - 12} more)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function ExplodeCard() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const explodeFn = useServerFn(explodePlatformData);

  const explode = useMutation({
    mutationFn: async () => {
      await explodeFn({ data: undefined });
    },
    onSuccess: async () => {
      setOpen(false);
      setConfirm("");
      await queryClient.invalidateQueries();
      toast.success("Platform data cleared — everything starts fresh.");
    },
    onError: (e: Error) =>
      toast.error(e.message === "FORBIDDEN" ? "Admins only" : e.message),
  });

  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Explode platform data</p>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            Wipes payments, analyses, credit history, partner commissions, applications and this audit
            log, and resets balances and partner earnings to zero. Accounts, roles, packages and payment
            details are kept.
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          Explode
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirm(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Explode all platform data?</DialogTitle>
            <DialogDescription>
              This permanently clears the admin dashboard and every partner dashboard. Type EXPLODE to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.toUpperCase())}
            placeholder="EXPLODE"
            aria-label="Type EXPLODE to confirm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={confirm !== "EXPLODE" || explode.isPending}
              onClick={() => explode.mutate()}
            >
              {explode.isPending ? "Clearing…" : "Explode everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? "group relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary to-[#1D4ED8] p-5 text-primary-foreground shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          : "group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.08] hover:shadow-md"
      }
    >
      <LogoSymbol
        aria-hidden
        className={
          highlight
            ? "absolute right-3 top-3 h-5 w-auto opacity-70 brightness-0 invert transition-transform duration-300 group-hover:scale-110"
            : "absolute right-3 top-3 h-5 w-auto text-primary/40 transition-all duration-300 group-hover:scale-110 group-hover:text-primary/80"
        }
      />
      <p className={highlight ? "relative pr-8 text-sm opacity-90" : "relative pr-8 text-sm text-muted-foreground transition-colors duration-300 group-hover:text-primary/90"}>
        {label}
      </p>
      <p className="relative mt-2 text-xl font-bold tracking-tight">{value}</p>
      <span
        className={
          highlight
            ? "pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/40"
            : "pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-[#1D4ED8] transition-transform duration-300 group-hover:scale-x-100"
        }
      />
      {highlight && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-15deg] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-300 group-hover:animate-shine group-hover:opacity-100" />
      )}
    </div>
  );
}

function PartnerPayouts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [rates, setRates] = useState<Record<string, string>>({});
  const [selectedPartnerPayouts, setSelectedPartnerPayouts] = useState<{ id: string; name: string } | null>(null);

  const { data, isFetching } = useQuery(adminPartnerListQuery(search));
  const rows = data ?? [];

  const setRate = useMutation({
    mutationFn: async ({ id, rate }: { id: string; rate: number }) => {
      if (!Number.isFinite(rate) || rate < 0 || rate > 100)
        throw new Error("Commission must be between 0 and 100%.");
      const { error } = await supabase.rpc("admin_set_commission_rate", { _user_id: id, _rate: rate });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Commission percentage saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearPayout = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { error } = await supabase.rpc("admin_clear_partner_payout", {
        _user_id: id,
        _note: note || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Payout cleared and recorded in history");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search partners by name, email or code"
        aria-label="Search partners"
        className="sm:max-w-sm"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            {isFetching ? "Loading partners…" : "No approved partners yet."}
          </p>
        )}
        {rows.map((p: AdminPartnerRow) => {
          const lifetimeRev = Number(p.lifetime_revenue_ghs ?? p.revenue_ghs);
          const lifetimeComm = Number(p.lifetime_commissions_ghs ?? p.commissions_ghs);
          const unpaidComm = Number(p.commissions_ghs ?? 0);

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{p.full_name ?? p.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.email} · Code: <span className="font-semibold text-foreground">{p.referral_code}</span> · {p.referral_count} referred
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0"
                  title="View Payout History"
                  onClick={() => setSelectedPartnerPayouts({ id: p.id, name: p.full_name ?? p.email ?? "Partner" })}
                >
                  <Clock className="size-4 text-muted-foreground" />
                </Button>
              </div>

              {/* All-time Lifetime Stats (Fixed) */}
              <div className="mt-3 rounded-xl bg-muted/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lifetime Performance (Fixed)</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span>Revenue: <strong className="text-foreground">{ghs(lifetimeRev)}</strong></span>
                  <span>Total Earned: <strong className="text-primary font-semibold">{ghs(lifetimeComm)}</strong></span>
                </div>
              </div>

              {/* Current Period Unpaid */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-background p-2.5">
                  <p className="text-[11px] text-muted-foreground">Period Revenue</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">{ghs(p.revenue_ghs)}</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-2.5">
                  <p className="text-[11px] text-muted-foreground">Unpaid Balance</p>
                  <p className="mt-0.5 text-sm font-bold text-primary">{ghs(unpaidComm)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`rate-${p.id}`} className="text-xs">
                    Commission %
                  </Label>
                  <Input
                    id={`rate-${p.id}`}
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={rates[p.id] ?? String(p.commission_rate)}
                    onChange={(e) => setRates({ ...rates, [p.id]: e.target.value })}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={setRate.isPending}
                  onClick={() =>
                    setRate.mutate({ id: p.id, rate: Number(rates[p.id] ?? p.commission_rate) })
                  }
                >
                  Save %
                </Button>
              </div>

              <Button
                size="sm"
                variant={unpaidComm > 0 ? "default" : "outline"}
                className="mt-3 w-full"
                disabled={clearPayout.isPending}
                onClick={() => clearPayout.mutate({ id: p.id })}
              >
                {unpaidComm > 0 ? `Mark ${ghs(unpaidComm)} as paid` : "Clear current period"}
              </Button>
              {p.payout_cleared_at && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Last payout: {new Date(p.payout_cleared_at).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {selectedPartnerPayouts && (
        <PartnerPayoutHistoryDialog
          partnerId={selectedPartnerPayouts.id}
          partnerName={selectedPartnerPayouts.name}
          onClose={() => setSelectedPartnerPayouts(null)}
        />
      )}
    </div>
  );
}

function PartnerPayoutHistoryDialog({
  partnerId,
  partnerName,
  onClose,
}: {
  partnerId: string;
  partnerName: string;
  onClose: () => void;
}) {
  const { data: payouts, isLoading } = useQuery(adminPartnerPayoutsQuery(partnerId));

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payout History — {partnerName}</DialogTitle>
          <DialogDescription>
            Record of cleared payouts and disbursements for this partner.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-xl border border-border bg-card">
          {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading history…</p>}
          {!isLoading && (payouts ?? []).length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No previous payouts recorded for this partner.</p>
          )}
          {(payouts ?? []).map((p: PartnerPayoutRow) => (
            <div key={p.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-semibold text-foreground">{ghs(p.amount_ghs)}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.cleared_at).toLocaleString()}</p>
                {p.note && <p className="text-xs text-muted-foreground italic mt-0.5">Note: {p.note}</p>}
              </div>
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600/30">
                Disbursed
              </Badge>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type MemberRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  credits: number;
  referral_code: string;
  created_at: string;
  last_sign_in_at: string | null;
  registration_paid: boolean;
  registration_paid_at: string | null;
  is_partner: boolean;
  is_admin: boolean;
  referred_by: string | null;
  referrer_name: string | null;
  spent_ghs: number;
  referral_count: number;
};

function PartnerManager() {
  const queryClient = useQueryClient();
  const { user } = Route.useRouteContext();
  const [search, setSearch] = useState("");
  const [onlyPartners, setOnlyPartners] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>("");

  const { data, isFetching } = useQuery(
    adminMemberListQuery({ search, onlyPartners, partnerId }),
  );
  const rows = (data ?? []) as MemberRow[];

  const { data: isDefaultAdmin } = useQuery({
    queryKey: ["is-default-admin", user.id],
    queryFn: async () => {
      const { data: ok, error } = await supabase.rpc("is_default_admin", { _user_id: user.id });
      if (error) throw new Error(error.message);
      return !!ok;
    },
  });

  const setAdmin = useMutation({
    mutationFn: async ({ id, make }: { id: string; make: boolean }) => {
      const { error } = await supabase.rpc("admin_set_admin", { _user_id: id, _make: make });
      if (error) throw new Error(error.message);
    },
    onSuccess: async (_d, vars) => {
      await queryClient.invalidateQueries();
      toast.success(vars.make ? "Admin role granted" : "Admin role removed");
    },
    onError: (e: Error) =>
      toast.error(
        e.message === "FORBIDDEN"
          ? "Admin access required"
          : e.message === "CANNOT_REMOVE_DEFAULT_ADMIN"
            ? "The default root admin cannot be removed"
            : e.message === "CANNOT_REMOVE_SELF"
              ? "You cannot remove your own admin role"
              : e.message,
      ),
  });

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

  const [expandedRows, setExpandedRows] = useState(false);
  const visibleRows = expandedRows ? rows : rows.slice(0, 12);

  return (
    <div className="space-y-4">
      <PartnerInviteLink />
      <PartnerApplications />

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
        {visibleRows.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                {m.full_name ?? m.email}
                {m.is_partner && <Badge>Partner</Badge>}
                {m.is_admin && <Badge variant="secondary">Admin</Badge>}
              </div>
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
            <div className="flex flex-wrap items-center gap-2">
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
              <Button
                size="sm"
                variant={m.is_admin ? "outline" : "secondary"}
                disabled={setAdmin.isPending || (m.id === user.id && m.is_admin)}
                onClick={() => setAdmin.mutate({ id: m.id, make: !m.is_admin })}
                title={m.id === user.id ? "Cannot remove your own admin role" : undefined}
              >
                {m.is_admin ? "Remove admin" : "Add admin"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {rows.length > 12 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedRows((v) => !v)}
            className="flex items-center gap-1.5"
          >
            {expandedRows ? (
              <>
                <ChevronUp className="size-4" /> Show less (top 12)
              </>
            ) : (
              <>
                <ChevronDown className="size-4" /> Show all {rows.length} members ({rows.length - 12} more)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function CreditAdjuster({ userId, label }: { userId: string; label: string }) {
  return <CreditAdjusterInner userId={userId} label={label} />;
}

function PartnerInviteLink() {
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== "undefined" ? `${window.location.origin}/register?partner=1` : "";

  const handleCopy = () => {
    if (!link) return;
    void navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Partner link copied to clipboard");
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-semibold text-foreground">Partner&apos;s registration link</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Send this to potential partners. They register, apply, and skip the registration fee — you
        approve or reject the application below.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={link} aria-label="Partner registration link" />
        <Button
          type="button"
          className="min-w-[120px] transition-all"
          onClick={handleCopy}
        >
          {copied ? (
            <span className="flex items-center gap-1.5 font-bold text-emerald-400 animate-in zoom-in-75 duration-200">
              <Check className="size-4 stroke-[3]" /> Copied!
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Copy className="size-4" /> Copy link
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

function PartnerApplications() {
  const queryClient = useQueryClient();
  const { data, isFetching } = useQuery({
    ...adminPartnerApplicationsQuery(),
    refetchInterval: 8000,
  });
  const rows = (data ?? []) as AdminApplicationRow[];

  const review = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc("review_partner_application", {
        _application_id: id,
        _approve: approve,
        _note: approve ? "Approved as partner" : "Application rejected",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async (_d, vars) => {
      await queryClient.invalidateQueries();
      toast.success(vars.approve ? "Partner approved" : "Application rejected");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">Partner applications</p>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">
            {isFetching ? "Loading applications…" : "No partner applications yet."}
          </p>
        )}
        {rows.map((a) => (
          <div key={a.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                <span className="truncate">{a.full_name ?? a.email ?? "Applicant"}</span>
                {a.status !== "pending" && (
                  <Badge variant={a.status === "approved" ? "default" : "destructive"}>{a.status}</Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {a.email} · {a.phone ?? "no phone"} · {new Date(a.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Audience: {a.audience}</p>
              <p className="text-xs text-muted-foreground">
                Payout: {a.payout_method} · {a.payout_details}
              </p>
            </div>
            {a.status === "pending" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: a.id, approve: true })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 sm:flex-none"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: a.id, approve: false })}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CreditAdjusterInner({ userId, label }: { userId: string; label: string }) {
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
  max_verdicts: string;
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
  max_verdicts: "2",
  is_active: true,
  sort_order: "0",
};

function AdminSettingsManager() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery(paymentSettingsQuery());
  const [draft, setDraft] = useState<{
    momo_number: string;
    recipient_name: string;
    network: string;
    instructions: string;
    registration_fee_ghs: string;
    developer_commission_rate: string;
    admin_commission_rate: string;
    default_partner_commission_rate: string;
  } | null>(null);

  const current = draft ?? {
    momo_number: settings?.momo_number ?? "",
    recipient_name: settings?.recipient_name ?? "",
    network: settings?.network ?? "MTN MoMo",
    instructions: settings?.instructions ?? "",
    registration_fee_ghs: String(settings?.registration_fee_ghs ?? 50),
    developer_commission_rate: String(settings?.developer_commission_rate ?? 65),
    admin_commission_rate: String(settings?.admin_commission_rate ?? 25),
    default_partner_commission_rate: String(settings?.default_partner_commission_rate ?? 10),
  };

  const save = useMutation({
    mutationFn: async () => {
      const number = current.momo_number.trim();
      const name = current.recipient_name.trim();
      const fee = Number(current.registration_fee_ghs) || 50;
      const devRate = Math.min(100, Math.max(0, Number(current.developer_commission_rate) || 65));
      const adminRate = Math.min(100, Math.max(0, Number(current.admin_commission_rate) || 25));
      const partnerRate = Math.min(100, Math.max(0, Number(current.default_partner_commission_rate) || 10));

      if (number.length < 6 || number.length > 30) throw new Error("Enter a valid payment number.");
      if (name.length < 2 || name.length > 80) throw new Error("Enter the recipient name.");

      const { error } = await supabase
        .from("payment_settings")
        .update({
          momo_number: number,
          recipient_name: name,
          network: current.network.trim() || "MTN MoMo",
          instructions: current.instructions.trim(),
          registration_fee_ghs: fee,
          developer_commission_rate: devRate,
          admin_commission_rate: adminRate,
          default_partner_commission_rate: partnerRate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", true);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast.success("Platform settings updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="grid max-w-2xl gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div>
        <h3 className="text-lg font-bold text-foreground">Platform & Commission Settings</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure commission percentages, payment gateway details, and registration fees.
        </p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
        <h4 className="text-sm font-semibold text-primary">System Commissions</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="dev-rate">Dev Commission (%)</Label>
            <Input
              id="dev-rate"
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={current.developer_commission_rate}
              onChange={(e) => setDraft({ ...current, developer_commission_rate: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">Dashboard dev card.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-rate">Admin Commission (%)</Label>
            <Input
              id="admin-rate"
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={current.admin_commission_rate}
              onChange={(e) => setDraft({ ...current, admin_commission_rate: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">Dashboard admin card.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner-rate">Partner Default (%)</Label>
            <Input
              id="partner-rate"
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={current.default_partner_commission_rate}
              onChange={(e) => setDraft({ ...current, default_partner_commission_rate: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">Base referral rate.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Payment Gateway & Checkout Details</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="momo-number">Payment Number (MoMo)</Label>
            <Input
              id="momo-number"
              value={current.momo_number}
              maxLength={30}
              onChange={(e) => setDraft({ ...current, momo_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Name</Label>
            <Input
              id="recipient"
              value={current.recipient_name}
              maxLength={80}
              onChange={(e) => setDraft({ ...current, recipient_name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="network">Network / Method Label</Label>
            <Input
              id="network"
              value={current.network}
              maxLength={40}
              onChange={(e) => setDraft({ ...current, network: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-fee">Registration Fee (GH₵)</Label>
            <Input
              id="reg-fee"
              type="number"
              min={0}
              step="1"
              value={current.registration_fee_ghs}
              onChange={(e) => setDraft({ ...current, registration_fee_ghs: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Payment Instructions (optional)</Label>
          <Textarea
            id="instructions"
            rows={3}
            value={current.instructions}
            maxLength={300}
            onChange={(e) => setDraft({ ...current, instructions: e.target.value })}
          />
        </div>
      </div>

      <Button type="submit" disabled={save.isPending} className="w-fit">
        Save Platform Settings
      </Button>
    </form>
  );
}

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
        _max_verdicts: Math.max(1, Math.trunc(Number(d.max_verdicts) || 1)),
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
        _max_verdicts: p.max_verdicts,
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue" value={ghs(overview?.revenue_ghs ?? 0)} />
        <Stat label="Credits sold" value={String(overview?.credits_sold ?? 0)} />
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
                {ghs(p.price_ghs)} · {p.credits} credits · {p.max_verdicts} verdicts/scan · slug {p.slug} ·
                order {p.sort_order}
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
                    max_verdicts: String(p.max_verdicts),
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
                <div className="space-y-2">
                  <Label htmlFor="pkg-verdicts">Verdicts per screenshot</Label>
                  <Input
                    id="pkg-verdicts"
                    type="number"
                    min={1}
                    value={draft.max_verdicts}
                    onChange={(e) => setDraft({ ...draft, max_verdicts: e.target.value })}
                    required
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
