import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, credits, referral_code, referred_by, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const rolesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["roles", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });

export const packagesQuery = () =>
  queryOptions({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("id, name, slug, price_ghs, credits, perks, sort_order, max_verdicts")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

export const verdictLimitQuery = (userId: string) =>
  queryOptions({
    queryKey: ["verdict-limit", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_verdict_limit");
      if (error) throw error;
      return Number(data ?? 1);
    },
  });

export type PaymentSettings = {
  momo_number: string;
  recipient_name: string;
  network: string;
  instructions: string;
};

export const paymentSettingsQuery = () =>
  queryOptions({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("momo_number, recipient_name, network, instructions")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as PaymentSettings | null;
    },
  });

export const analysesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["analyses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, title, status, summary, credits_used, created_at, image_path")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

export const analysisQuery = (id: string) =>
  queryOptions({
    queryKey: ["analysis", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("analyses").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const paymentsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["payments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount_ghs, credits, method, reference, status, admin_note, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const creditHistoryQuery = (userId: string) =>
  queryOptions({
    queryKey: ["credit-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("id, delta, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

export const partnerApplicationQuery = (userId: string) =>
  queryOptions({
    queryKey: ["partner-application", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const commissionsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["commissions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_commissions")
        .select("id, amount_ghs, created_at, payment_id")
        .eq("partner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const referralsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["referrals", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", userId);
      if (error) throw error;
      return count ?? 0;
    },
  });

export const adminStatsQuery = () =>
  queryOptions({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as {
        members: number;
        analyses: number;
        pending_payments: number;
        pending_partners: number;
        revenue_ghs: number;
      };
    },
  });

export const adminPaymentsQuery = () =>
  queryOptions({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, user_id, amount_ghs, credits, method, reference, sender_name, status, admin_note, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

export const adminApplicationsQuery = () =>
  queryOptions({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

export const adminMembersQuery = () =>
  queryOptions({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, credits, referral_code, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

export const auditLogsQuery = () =>
  queryOptions({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, entity, entity_id, meta, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

export const ghs = (value: number | string) =>
  `GH\u20B5${Number(value).toLocaleString("en-GH", { minimumFractionDigits: 0 })}`;

export type PackageRow = {
  id: string;
  name: string;
  slug: string;
  price_ghs: number;
  credits: number;
  perks: unknown;
  max_verdicts: number;
  is_active: boolean;
  sort_order: number;
};

export const adminPackagesQuery = () =>
  queryOptions({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("id, name, slug, price_ghs, credits, perks, max_verdicts, is_active, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as PackageRow[];
    },
  });

export const adminCreditOverviewQuery = () =>
  queryOptions({
    queryKey: ["admin-credit-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_credit_overview");
      if (error) throw error;
      return (data ?? {}) as {
        credits_outstanding: number;
        credits_sold: number;
        credits_spent: number;
        revenue_ghs: number;
        active_packages: number;
      };
    },
  });

export const partnerStatsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["partner-stats", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("partner_stats");
      if (error) throw error;
      return (data ?? { registrations: 0, revenue_ghs: 0, commissions_ghs: 0 }) as {
        registrations: number;
        revenue_ghs: number;
        commissions_ghs: number;
        commission_rate?: number;
      };
    },
  });

export type AdminPartnerRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  referral_code: string;
  commission_rate: number;
  payout_cleared_at: string | null;
  referral_count: number;
  revenue_ghs: number;
  commissions_ghs: number;
};

export const adminPartnerListQuery = (search?: string) =>
  queryOptions({
    queryKey: ["admin-partner-list", search ?? ""],
    queryFn: async () => {
      const term = search?.trim();
      const { data, error } = await supabase.rpc(
        "admin_partner_list",
        term ? { _search: term } : {},
      );
      if (error) throw error;
      return (data ?? []) as AdminPartnerRow[];
    },
  });

export const adminMemberListQuery = (args: {
  search?: string;
  onlyPartners?: boolean;
  partnerId?: string | null;
}) =>
  queryOptions({
    queryKey: ["admin-member-list", args.search ?? "", args.onlyPartners ?? false, args.partnerId ?? null],
    queryFn: async () => {
      const search = args.search?.trim();
      const params: { _only_partners: boolean; _search?: string; _partner_id?: string } = {
        _only_partners: args.onlyPartners ?? false,
      };
      if (search) params._search = search;
      if (args.partnerId) params._partner_id = args.partnerId;
      const { data, error } = await supabase.rpc("admin_member_list", params);
      if (error) throw error;
      return data ?? [];
    },
  });
