import { createFileRoute } from "@tanstack/react-router";
import { Shield, Lock, Eye, Database, Key, Bell, CheckCircle2 } from "lucide-react";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LogoSymbol } from "@/components/brand/Logo";
import { LegalHeroBanner } from "@/components/brand/LegalHeroBanner";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Virtu-IQ" },
      {
        name: "description",
        content: "Learn how Virtu-IQ protects your personal information, analysis uploads, payments, and account data.",
      },
      { property: "og:title", content: "Privacy Policy — Virtu-IQ" },
      { property: "og:description", content: "Data security, encryption, and privacy standards at Virtu-IQ." },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen relative bg-slate-50 text-foreground flex flex-col" style={{ overflowX: "clip" }}>
      <SiteNavbar />

      <main className="flex-1">
        {/* Animated Banner with Auth Background aesthetics & drift watermarks */}
        <LegalHeroBanner
          badgeIcon={<Shield className="size-3" />}
          badgeText="SECURITY & PRIVACY"
          lastUpdated="Last Updated: August 2026"
          title="Privacy Policy"
          description="At Virtu-IQ, your privacy and operational security are non-negotiable. This policy details how we handle your account credentials, screenshot analysis data, and transactions."
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
                  <Database className="size-5 text-primary" />
                  1. Information We Collect
                </h2>
                <p className="text-slate-600 mb-3">
                  We only gather information necessary to provide outcome analysis, process package payments, and administer referral rewards:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>
                    <strong className="text-slate-900">Account Identifiers:</strong> Your mobile phone number, full name, encrypted password hash, and partner referral associations.
                  </li>
                  <li>
                    <strong className="text-slate-900">Uploaded Media:</strong> Screenshots uploaded for algorithmic outcome extraction (processed over encrypted channels).
                  </li>
                  <li>
                    <strong className="text-slate-900">Payment References:</strong> Mobile Money transaction IDs, sender names, and package tier choices required for manual/automated verification.
                  </li>
                  <li>
                    <strong className="text-slate-900">Platform Analytics:</strong> Device type, approximate browser telemetry, and system audit logs for fraud prevention and security monitoring.
                  </li>
                </ul>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Key className="size-5 text-emerald-600" />
                  2. How We Use Your Data
                </h2>
                <p className="text-slate-600 mb-3">
                  Collected information is utilized strictly for system operations:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 my-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <p className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider mb-1">Outcome Processing</p>
                    <p className="text-xs text-slate-600">Reading match identifiers and delivering instant virtual result intelligence before match rendering.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <p className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider mb-1">Credit Allocation</p>
                    <p className="text-xs text-slate-600">Tracking scan balances, package renewals, and partner commission disbursements accurately.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <p className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider mb-1">Account Protection</p>
                    <p className="text-xs text-slate-600">Enforcing rate limits, preventing automated abuse, and protecting against unauthorized access.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <p className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider mb-1">Audit Compliance</p>
                    <p className="text-xs text-slate-600">Immutable ledgering of transaction reviews, payment approvals, and administrative actions.</p>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Lock className="size-5 text-primary" />
                  3. Data Security & Encryption
                </h2>
                <p className="text-slate-600 mb-3">
                  Virtu-IQ enforces bank-grade security protocols across all infrastructure layers:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>256-bit TLS encryption in transit for all image uploads, API requests, and web sessions.</li>
                  <li>PostgreSQL Row-Level Security (RLS) policies guaranteeing members and partners only view their own records.</li>
                  <li>Zero storage of raw payment PINs, Mobile Money passwords, or sensitive financial tokens.</li>
                  <li>Isolated cloud storage buckets with time-limited signed URL access for uploaded analysis screenshots.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Eye className="size-5 text-slate-700" />
                  4. Third-Party Sharing
                </h2>
                <p className="text-slate-600 mb-2">
                  We <strong className="text-slate-900">never sell, rent, or trade</strong> your personal information or analysis history to third parties or marketing brokers.
                </p>
                <p className="text-slate-600">
                  Data is shared solely with vetted infrastructure partners (such as database and hosting providers) strictly necessary to run the Virtu-IQ application.
                </p>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Bell className="size-5 text-emerald-600" />
                  5. Your Rights & Account Controls
                </h2>
                <p className="text-slate-600 mb-3">
                  As a Virtu-IQ member, you have full control over your platform data:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>Review and download your historical outcome exposures at any time.</li>
                  <li>Update your password and security credentials directly from your dashboard.</li>
                  <li>Request permanent account deletion and removal of all associated transaction records via support.</li>
                </ul>
              </div>

              {/* Callout box */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-950">Questions regarding privacy?</strong>
                  <p className="mt-0.5">Contact the Virtu-IQ data compliance team via the support portal or directly through your assigned partner representative.</p>
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
