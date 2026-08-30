import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogoFull } from "@/components/brand/Logo";
import { Shield, Terminal } from "lucide-react";

const groups = [
  {
    title: "System",
    items: [
      { label: "How It Works", href: "/#how-it-works", isHash: true },
      { label: "Features", href: "/#features", isHash: true },
      { label: "Packages", href: "/#packages", isHash: true },
      { label: "Accuracy Reports", href: "/#features", isHash: true },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Virtu-IQ", href: "/#features", isHash: true },
      { label: "Partner Program", href: "/partner-apply" },
      { label: "Create Account", href: "/register" },
      { label: "Member Login", href: "/login" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help & FAQ", href: "/#faq", isHash: true },
      { label: "Getting Started", href: "/register" },
      { label: "Account Security", href: "/privacy" },
      { label: "System Status", href: "/" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Acceptable Use", href: "/acceptable-use" },
    ],
  },
];

export function SiteFooter() {
  const navigate = useNavigate();
  const [legalClicks, setLegalClicks] = useState<Record<string, number>>({});

  const handleLegalClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const current = legalClicks[href] ?? 0;
    const next = current + 1;

    if (next >= 4) {
      setLegalClicks((prev) => ({ ...prev, [href]: 0 }));
      void navigate({ to: href as any });
    } else {
      setLegalClicks((prev) => ({ ...prev, [href]: next }));
    }
  };

  return (
    <footer
      className="border-t bg-[#EDEFF3] border-primary/40 text-foreground"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 sm:px-6">
        {/* Logo + tagline */}
        <div className="mb-8 sm:mb-10">
          <Link to="/" aria-label="Virtu-IQ home" className="inline-block">
            <LogoFull className="h-6 sm:h-7" />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Our proprietary algorithm penetrates the SportyBet instant virtual engine — exposing the next outcome before the game loads.
          </p>
          {/* System status */}
          <div
            className="mt-4 inline-flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5"
          >
            <span
              className="size-2 rounded-full bg-emerald-600 animate-status-blink"
            />
            <span className="font-mono text-xs font-bold text-emerald-700">
              SYSTEM ONLINE
            </span>
          </div>
        </div>

        {/* Links grid — 2 cols on mobile, 4 on tablet+ */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {groups.map((g) => (
            <div key={g.title}>
              <h3
                className="text-sm font-semibold tracking-wider text-foreground uppercase font-mono"
              >
                {g.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {g.items.map((item) => {
                  const isLegalGroup = g.title === "Legal";

                  if (isLegalGroup) {
                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={(e) => handleLegalClick(e, item.href)}
                          className="text-left text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none"
                        >
                          {item.label}
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      {item.isHash ? (
                        <a
                          href={item.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          to={item.href as any}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Virtu-IQ. All rights reserved. For entertainment purposes only.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Shield className="size-3.5 text-primary" />
              <span className="font-mono text-xs font-semibold text-primary">
                256-BIT ENCRYPTED
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Terminal className="size-3.5 text-emerald-600" />
              <span className="font-mono text-xs font-semibold text-emerald-700">
                BREACH ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}