import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Handshake, Loader2, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogoFull, LogoSymbol, LogoWatermark } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { partnerApplicationQuery } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partner-apply")({
  head: () => ({
    meta: [
      { title: "Partner Application — Virtu-IQ" },
      {
        name: "description",
        content: "Apply to become a verified Virtu-IQ partner and earn commission on every member you refer.",
      },
      { property: "og:title", content: "Partner Application — Virtu-IQ" },
      { property: "og:description", content: "Apply to become a verified Virtu-IQ partner." },
    ],
  }),
  component: PartnerApplyPage,
});

function PartnerApplyPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: application, isLoading } = useQuery({
    ...partnerApplicationQuery(user.id),
    refetchInterval: 4000,
  });

  const [audience, setAudience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("MTN MoMo");
  const [payoutDetails, setPayoutDetails] = useState("");

  // Live approval: no refresh needed
  useEffect(() => {
    const channel = supabase
      .channel(`partner-app-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_applications", filter: `user_id=eq.${user.id}` },
        () => void queryClient.invalidateQueries({ queryKey: ["partner-application", user.id] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${user.id}` },
        () => void queryClient.invalidateQueries({ queryKey: ["partner-application", user.id] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user.id, queryClient]);

  const status = application?.status ?? null;

  useEffect(() => {
    if (status !== "approved") return;
    const t = setTimeout(() => void navigate({ to: "/partner", replace: true }), 1400);
    return () => clearTimeout(t);
  }, [status, navigate]);

  const submit = useMutation({
    mutationFn: async () => {
      if (audience.trim().length < 3) throw new Error("Tell us about your audience.");
      if (motivation.trim().length < 10) throw new Error("Tell us why you want to partner with Virtu-IQ.");
      if (payoutDetails.trim().length < 5) throw new Error("Add your payout number or account details.");
      const { error } = await supabase.from("partner_applications").insert({
        user_id: user.id,
        audience: audience.trim().slice(0, 300),
        motivation: motivation.trim().slice(0, 1000),
        payout_method: payoutMethod,
        payout_details: payoutDetails.trim().slice(0, 200),
        status: "pending",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["partner-application", user.id] });
      toast.success("Application submitted for review");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="mx-auto w-full max-w-xl">
      <div className="flex justify-center">
        <LogoFull className="h-7" />
      </div>

      {status === "rejected" ? (
        <section className="relative mt-8 overflow-hidden rounded-2xl border border-destructive/30 bg-card p-8 text-center">
          <ShieldX className="mx-auto size-12 text-destructive" />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-destructive">REJECTED</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sorry, you can&apos;t be a partner.
          </p>
          {application?.admin_note && (
            <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              {application.admin_note}
            </p>
          )}
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => void supabase.auth.signOut().then(() => navigate({ to: "/login" }))}
          >
            Sign out
          </Button>
        </section>
      ) : status === "approved" ? (
        <section className="relative mt-8 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary via-primary to-[#1D4ED8] p-8 text-center text-primary-foreground">
          <LogoWatermark className="h-52 sm:h-64" />
          <CheckCircle2 className="relative mx-auto size-12" />
          <h1 className="relative mt-4 text-2xl font-bold tracking-tight">Accepted</h1>
          <p className="relative mt-2 text-sm opacity-90">
            Welcome aboard — opening your partner dashboard…
          </p>
        </section>
      ) : status === "pending" ? (
        <section className="relative mt-8 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 p-8 text-center">
          <LogoSymbol className="pointer-events-none absolute -right-6 -bottom-8 h-40 w-auto opacity-[0.06]" aria-hidden />
          {/* Animated waiting indicator */}
          <div className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <Loader2 className="size-8 animate-spin text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="relative text-xl font-bold tracking-tight text-amber-800 dark:text-amber-300">
            Application under review
          </h1>
          <p className="relative mt-2 text-sm leading-relaxed text-amber-700/80 dark:text-amber-400/80">
            Your partner application has been submitted and is being reviewed by our team.
            You&apos;ll get instant access to your partner dashboard the moment you&apos;re approved —
            no need to refresh this page.
          </p>
          {/* What happens next */}
          <div className="relative mt-6 space-y-3 rounded-xl border border-amber-200 bg-white/70 dark:border-amber-800/40 dark:bg-amber-950/30 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              What happens next
            </p>
            <div className="space-y-2.5">
              {[
                { done: true, label: "Account created & fee waived" },
                { done: true, label: "Application submitted for review" },
                { done: false, label: "Admin approves your application" },
                { done: false, label: "Partner dashboard unlocked automatically" },
              ].map(({ done, label }, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      done
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-300",
                    )}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span
                    className={cn(
                      done
                        ? "text-emerald-700 dark:text-emerald-400 line-through"
                        : "text-foreground font-medium",
                    )}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="relative mt-5 text-xs text-muted-foreground">
            This page updates in real time. You can safely leave and come back.
          </p>
        </section>
      ) : (
        <section className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
          <LogoSymbol className="pointer-events-none absolute -right-6 -bottom-10 h-44 w-auto opacity-[0.05]" aria-hidden />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Handshake className="size-3.5" /> Partner application
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
              Apply to partner with Virtu-IQ
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              No registration fee for partners. Once approved you get your own referral link and dashboard.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="audience">Your audience</Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. 4,000 followers on a football tips channel"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivation">Why do you want to be a partner?</Label>
                <Textarea
                  id="motivation"
                  rows={4}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="How you plan to introduce Virtu-IQ to your people"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payout-method">Payout method</Label>
                  <Input
                    id="payout-method"
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout-details">Payout number / account</Label>
                  <Input
                    id="payout-details"
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    placeholder="024 000 0000"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submit.isPending || isLoading}>
                {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Submit application
              </Button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
