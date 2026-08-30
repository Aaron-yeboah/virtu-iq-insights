import { createFileRoute } from "@tanstack/react-router";
import { Scale, AlertTriangle, ShieldCheck, Zap, HelpCircle, CheckCircle2 } from "lucide-react";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LogoSymbol } from "@/components/brand/Logo";
import { LegalHeroBanner } from "@/components/brand/LegalHeroBanner";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Virtu-IQ" },
      {
        name: "description",
        content: "Review the Terms of Service governing access to the Virtu-IQ virtual match outcome analysis platform.",
      },
      { property: "og:title", content: "Terms of Service — Virtu-IQ" },
      { property: "og:description", content: "Rules, user agreements, and service guidelines for Virtu-IQ members." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen relative bg-slate-50 text-foreground flex flex-col" style={{ overflowX: "clip" }}>
      <SiteNavbar />

      <main className="flex-1">
        {/* Animated Banner with Auth Background aesthetics & drift watermarks */}
        <LegalHeroBanner
          badgeIcon={<Scale className="size-3" />}
          badgeText="USER AGREEMENT"
          lastUpdated="Last Updated: August 2026"
          title="Terms of Service"
          description="These Terms of Service govern your access to and use of the Virtu-IQ outcome analysis workspace, credit packages, partner features, and services."
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
                  <ShieldCheck className="size-5 text-primary" />
                  1. Acceptance of Terms
                </h2>
                <p className="text-slate-600 mb-2">
                  By creating an account, paying a registration fee, purchasing credit packages, or otherwise accessing Virtu-IQ, you agree to be bound by these Terms of Service.
                </p>
                <p className="text-slate-600">
                  If you do not agree to these terms, you must not use or access the Virtu-IQ platform.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Zap className="size-5 text-emerald-600" />
                  2. Services & Credit System
                </h2>
                <p className="text-slate-600 mb-3">
                  Virtu-IQ provides algorithmic optical and outcome intelligence for instant virtual sporting events:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>
                    <strong className="text-slate-900">Scan Credits:</strong> Credits are consumed upon successful analysis of an uploaded match screenshot. Each package determines the number of scan credits and verdict limit per analysis.
                  </li>
                  <li>
                    <strong className="text-slate-900">Validity & Non-Transferability:</strong> Credits are associated exclusively with your registered account and cannot be transferred, sold, or shared across accounts.
                  </li>
                  <li>
                    <strong className="text-slate-900">Service Availability:</strong> We strive for 99.9% uptime, but analysis latency may vary based on network conditions and source feed availability.
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <AlertTriangle className="size-5 text-amber-500" />
                  3. Entertainment & Informational Disclaimer
                </h2>
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 mb-4 text-amber-950 text-xs sm:text-sm leading-relaxed">
                  <strong>Important Notice:</strong> Virtu-IQ is an independent AI analysis tool designed for entertainment and statistical reference. Virtu-IQ is not affiliated with, endorsed by, or partnered with SportyBet or any third-party sportsbook operator.
                </div>
                <p className="text-slate-600 mb-2">
                  While our proprietary algorithm decodes match frame data with high precision, virtual gaming outcomes are subject to underlying simulation mechanics.
                </p>
                <p className="text-slate-600">
                  Users are solely responsible for their wagering decisions. Virtu-IQ is not liable for any financial losses incurred through third-party platforms.
                </p>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Scale className="size-5 text-slate-800" />
                  4. Partner & Referral Program
                </h2>
                <p className="text-slate-600 mb-3">
                  Approved partners earn commissions based on their configured referral percentage when referred members purchase packages:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>Partners must not engage in deceptive marketing, spam, or misleading claims.</li>
                  <li>Commission payouts are subject to administrative review, verification of genuine referral activity, and manual clearance via Mobile Money.</li>
                  <li>Virtu-IQ reserves the right to suspend partner status if fraudulent or self-referral schemes are detected.</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <HelpCircle className="size-5 text-primary" />
                  5. Termination & Modifications
                </h2>
                <p className="text-slate-600 mb-2">
                  We reserve the right to suspend or terminate accounts that violate our Acceptable Use Policy, engage in scraping or reverse engineering, or attempt platform fraud.
                </p>
                <p className="text-slate-600">
                  We may modify these Terms periodically. Continued use of the platform after updates constitutes acceptance of revised terms.
                </p>
              </div>

              {/* Callout box */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 sm:p-5 flex items-start gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-950">Need clarification?</strong>
                  <p className="mt-0.5">Reach out through our support desk for any questions regarding service terms, credit tier allocations, or account agreements.</p>
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
