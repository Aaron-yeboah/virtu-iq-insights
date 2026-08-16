import { LogoFull } from "@/components/brand/Logo";
import { Shield, Terminal } from "lucide-react";

const groups = [
  { title: "System", items: ["How It Works", "Features", "Packages", "Accuracy Reports"] },
  { title: "Company", items: ["About", "Contact", "Careers", "Blog"] },
  { title: "Support", items: ["Help Center", "Getting Started", "Account Security", "Status"] },
  { title: "Legal", items: ["Privacy Policy", "Terms", "Refund Policy", "Acceptable Use"] },
];

export function SiteFooter() {
  return (
    <footer
      className="border-t"
      style={{
        background: "oklch(0.06 0 0)",
        borderColor: "oklch(0.53 0.22 27 / 0.3)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 sm:px-6">
        {/* Logo + tagline */}
        <div className="mb-8 sm:mb-10">
          <LogoFull className="h-8 sm:h-9" />
          <p className="mt-3 max-w-xs text-sm font-mono" style={{ color: "oklch(0.45 0.01 0)" }}>
            Our proprietary algorithm penetrates the SportyBet instant virtual engine — exposing the next outcome before the game loads.
          </p>
          {/* System status */}
          <div
            className="mt-4 inline-flex items-center gap-2 rounded border px-3 py-1.5"
            style={{
              borderColor: "oklch(0.72 0.22 142 / 0.3)",
              background: "oklch(0.72 0.22 142 / 0.05)",
            }}
          >
            <span
              className="size-2 rounded-full animate-status-blink"
              style={{ background: "oklch(0.72 0.22 142)" }}
            />
            <span className="font-mono text-xs font-bold" style={{ color: "oklch(0.72 0.22 142)" }}>
              SYSTEM ONLINE
            </span>
          </div>
        </div>

        {/* Links grid — 2 cols on mobile, 4 on tablet+ */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {groups.map((g) => (
            <div key={g.title}>
              <h3
                className="text-sm font-semibold font-mono tracking-wider"
                style={{ color: "oklch(0.95 0 0)" }}
              >
                {g.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {g.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm font-mono transition-colors"
                      style={{ color: "oklch(0.42 0.01 0)" }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.color = "oklch(0.53 0.22 27)";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.color = "oklch(0.42 0.01 0)";
                      }}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "oklch(0.18 0.012 27)" }}
        >
          <p className="text-xs font-mono" style={{ color: "oklch(0.38 0.01 0)" }}>
            © {new Date().getFullYear()} Virtu-IQ. All rights reserved. For entertainment purposes only.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Shield className="size-3.5" style={{ color: "oklch(0.53 0.22 27)" }} />
              <span className="font-mono text-xs font-semibold" style={{ color: "oklch(0.53 0.22 27)" }}>
                256-BIT ENCRYPTED
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Terminal className="size-3.5" style={{ color: "oklch(0.72 0.22 142)" }} />
              <span className="font-mono text-xs font-semibold" style={{ color: "oklch(0.72 0.22 142)" }}>
                BREACH ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}