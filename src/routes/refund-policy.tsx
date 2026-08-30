import { createFileRoute } from "@tanstack/react-router";
import { RefreshCcw, Receipt, ShieldAlert, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LogoSymbol } from "@/components/brand/Logo";
import { LegalHeroBanner } from "@/components/brand/LegalHeroBanner";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Virtu-IQ" },
      {
        name: "description",
        content: "Understand Virtu-IQ's policy on scan credit refunds, payment verification disputes, and failed analyses.",
      },
      { property: "og:title", content: "Refund Policy — Virtu-IQ" },
      { property: "og:description", content: "Clear, transparent refund and credit reimbursement guidelines at Virtu-IQ." },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <div className="min-h-screen relative bg-slate-50 text-foreground flex flex-col" style={{ overflowX: "clip" }}>
      <SiteNavbar />

      <main className="flex-1">
        {/* Animated Banner with Auth Background aesthetics & drift watermarks */}
        <LegalHeroBanner
          badgeIcon={<RefreshCcw className="size-3" />}
          badgeText="TRANSPARENT REIMBURSEMENTS"
          lastUpdated="Last Updated: August 2026"
          title="Refund Policy"
          description="We stand behind our analysis engine with clear, transparent rules regarding credit consumption, technical errors, and payment reviews."
        />

        {/* Content Document */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl">
            {/* Embedded Logo Watermark */}
            <LogoSymbol
              className="pointer-events-none absolute -right-12 -bottom-16 h-80 w-auto opacity-[0.035] select-none"
              aria-hidden
            />

            <div className="relative space-y-10 text-slate-700 text-sm sm:text-base leading-relaxed">
              {/* Section 1 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <RefreshCcw className="size-5 text-emerald-600" />
                  1. Automatic Credit Reimbursement (Failed Analyses)
                </h2>
                <p className="text-slate-600 mb-3">
                  Virtu-IQ is built with safety guards to protect your balance:
                </p>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2 text-xs sm:text-sm text-emerald-950">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    Zero Risk on Unreadable Screenshots:
                  </p>
                  <p>
                    If our vision algorithm cannot decipher your uploaded screenshot due to image corruption, blurriness, or server connectivity issues, <strong className="text-emerald-900">no credits are deducted</strong> (or deducted credits are automatically restored to your wallet).
                  </p>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Receipt className="size-5 text-primary" />
                  2. Digital Services & Credit Packages
                </h2>
                <p className="text-slate-600 mb-3">
                  Because scan credits provide immediate digital algorithmic intelligence upon consumption:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>
                    <strong className="text-slate-900">Consumed Credits:</strong> Once a match outcome analysis has been delivered and recorded in your history, the consumed scan credit is strictly non-refundable.
                  </li>
                  <li>
                    <strong className="text-slate-900">Unused Balances:</strong> If an account holder has purchased a package in error and has not consumed any credits, they may request a refund within 48 hours of payment approval.
                  </li>
                  <li>
                    <strong className="text-slate-900">Registration Fees:</strong> The one-time registration fee covers account provisioning, database security setup, and verification. It is non-refundable once verified and activated.
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Clock className="size-5 text-blue-600" />
                  3. Payment Review & Mobile Money Disputes
                </h2>
                <p className="text-slate-600 mb-3">
                  Payments made via Mobile Money (MTN, Telecel, AirtelTigo) are subject to manual or automated verification:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>If a submitted payment reference cannot be matched on our telecommunications statement, it is marked as rejected.</li>
                  <li>In the event of an accidental double transfer, our administrators will verify the secondary transaction reference and process a refund to the originating mobile money wallet.</li>
                  <li>Refund processing timeframes typically take 24 to 48 business hours once identity and transaction ownership are confirmed.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <ShieldAlert className="size-5 text-amber-500" />
                  4. Disputed Outcome Claims
                </h2>
                <p className="text-slate-600 mb-2">
                  Virtual sporting simulations produce results based on computational simulations. While Virtu-IQ delivers mathematical and statistical outcome extraction, variations in game execution or user wagering timing do not qualify for cash refunds.
                </p>
                <p className="text-slate-600">
                  If you believe a software glitch occurred during analysis processing, our technical team will inspect the system audit logs and credit your wallet accordingly.
                </p>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <AlertCircle className="size-5 text-primary" />
                  5. How to Submit a Refund Request
                </h2>
                <p className="text-slate-600 mb-3">
                  To open a review with our finance team, provide the following details:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                  <li>Your registered mobile phone number and account name.</li>
                  <li>The Mobile Money transaction reference number and exact transfer amount.</li>
                  <li>A brief description of the issue or proof of duplicate charge.</li>
                </ol>
              </div>

              {/* Callout box */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-950">Dedicated Support</strong>
                  <p className="mt-0.5">Submit your request directly through the help desk or contact our administrative team for prompt resolution.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
