import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Ban, Terminal, AlertOctagon, Users, CheckCircle2, Lock } from "lucide-react";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LogoSymbol } from "@/components/brand/Logo";
import { LegalHeroBanner } from "@/components/brand/LegalHeroBanner";

export const Route = createFileRoute("/acceptable-use")({
  head: () => ({
    meta: [
      { title: "Acceptable Use Policy — Virtu-IQ" },
      {
        name: "description",
        content: "Guidelines for acceptable and prohibited activities on the Virtu-IQ platform.",
      },
      { property: "og:title", content: "Acceptable Use Policy — Virtu-IQ" },
      { property: "og:description", content: "Standards for fair use, API access, partner integrity, and security at Virtu-IQ." },
    ],
  }),
  component: AcceptableUsePage,
});

function AcceptableUsePage() {
  return (
    <div className="min-h-screen relative bg-slate-50 text-foreground flex flex-col" style={{ overflowX: "clip" }}>
      <SiteNavbar />

      <main className="flex-1">
        {/* Animated Banner with Auth Background aesthetics & drift watermarks */}
        <LegalHeroBanner
          badgeIcon={<ShieldCheck className="size-3" />}
          badgeText="COMMUNITY STANDARDS & INTEGRITY"
          lastUpdated="Last Updated: August 2026"
          title="Acceptable Use Policy"
          description="This policy outlines required standards of conduct, prohibited behaviors, and system abuse guidelines for all Virtu-IQ members, partners, and visitors."
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
                  <Terminal className="size-5 text-primary" />
                  1. System Integrity & Automated Access
                </h2>
                <p className="text-slate-600 mb-3">
                  To ensure equitable resource allocation and high-speed outcome generation for all users:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>Users may not deploy headless scrapers, bot scripts, or automated tools to bypass client rate limits or upload queues.</li>
                  <li>Reverse engineering, decompiling, or attempting to extract proprietary vision model weights or algorithmic heuristics is strictly prohibited.</li>
                  <li>Submitting synthetic, manipulated, or fabricated screenshots aimed at disrupting optical parsing algorithms is forbidden.</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Ban className="size-5 text-red-600" />
                  2. Prohibited Financial Practices
                </h2>
                <p className="text-slate-600 mb-3">
                  Virtu-IQ enforces zero-tolerance rules for fraudulent or dishonest financial submissions:
                </p>
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-2 text-xs sm:text-sm text-red-950">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertOctagon className="size-4 text-red-600 shrink-0" />
                    Strictly Prohibited:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-red-900">
                    <li>Submitting fraudulent, reused, or fake Mobile Money transaction references.</li>
                    <li>Attempting payment spoofing or chargeback fraud after consuming scan credits.</li>
                    <li>Operating multi-accounting referral rings to illicitly siphon commission balances.</li>
                  </ul>
                </div>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Users className="size-5 text-emerald-600" />
                  3. Partner & Affiliate Standards
                </h2>
                <p className="text-slate-600 mb-3">
                  Partners representing Virtu-IQ must adhere to professional promotional standards:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>No false promises of 100% financial return or guaranteed wagering wealth.</li>
                  <li>No spamming public discussion boards, private messaging channels, or unsolicited bulk SMS campaigns.</li>
                  <li>All promotional materials must clearly display the disclaimer that virtual sports analysis is for entertainment and informational reference.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold font-mono text-slate-950 mb-3 border-b border-slate-100 pb-2">
                  <Lock className="size-5 text-slate-800" />
                  4. Enforcement & Account Actions
                </h2>
                <p className="text-slate-600 mb-2">
                  Violations of this Acceptable Use Policy may result in immediate sanctions, including:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>Temporary suspension of screenshot analysis privileges.</li>
                  <li>Forfeiture of fraudulent commission balances and partner status revocation.</li>
                  <li>Permanent termination of member accounts and IP/device banning.</li>
                </ul>
              </div>

              {/* Callout box */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-950">Reporting Violations</strong>
                  <p className="mt-0.5">If you encounter abuse, security vulnerabilities, or unauthorized partner activity, please report it immediately to our security operations desk.</p>
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
