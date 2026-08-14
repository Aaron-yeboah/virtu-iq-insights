import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  adminApplicationsQuery,
  adminMemberListQuery,
  adminMembersQuery,
  adminPaymentsQuery,
  adminStatsQuery,
  auditLogsQuery,
  ghs,
  rolesQuery,
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
          <TabsTrigger value="manage-partners">Manage partners</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

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
              <span className="text-sm font-semibold text-foreground">{m.credits} credits</span>
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
