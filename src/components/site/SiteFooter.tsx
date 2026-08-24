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
      className="border-t bg-[#EDEFF3] border-primary/40 text-foreground"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 sm:px-6">
        {/* Logo + tagline */}
        <div className="mb-8 sm:mb-10">
          <LogoFull className="h-8 sm:h-9" />
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
                className="text-sm font-semibold tracking-wider text-foreground uppercase"
              >
                {g.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {g.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
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