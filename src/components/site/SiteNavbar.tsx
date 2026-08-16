import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoFull, LogoSymbol } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Packages", href: "#packages" },
  { label: "FAQ", href: "#faq" },
];

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        background: "oklch(0.06 0 0 / 0.95)",
        borderColor: "oklch(0.53 0.22 27 / 0.4)",
        boxShadow: "0 1px 0 oklch(0.53 0.22 27 / 0.15), 0 4px 20px oklch(0 0 0 / 0.5)",
      }}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" aria-label="Virtu-IQ home" className="flex items-center gap-2 group shrink-0">
          <LogoFull className="hidden h-7 sm:h-8 md:block" />
          <LogoSymbol className="h-7 sm:h-8 md:hidden" />
          {/* Terminal indicator — hidden on very small screens */}
          <span
            className="hidden sm:flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest"
            style={{
              borderColor: "oklch(0.72 0.22 142 / 0.4)",
              color: "oklch(0.72 0.22 142)",
              background: "oklch(0.72 0.22 142 / 0.06)",
            }}
          >
            <Terminal className="size-2.5" />
            ACTIVE
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium transition-colors font-mono"
              style={{ color: "oklch(0.55 0.01 0)" }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "oklch(0.72 0.22 142)"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "oklch(0.55 0.01 0)"; }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 lg:flex">
          {loading ? null : isAuthenticated ? (
            <Button asChild className="animate-red-glow font-mono font-bold tracking-wide">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="font-mono text-sm" style={{ color: "oklch(0.55 0.01 0)" }}>
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild className="font-mono font-bold tracking-widest animate-red-glow">
                <Link to="/register">GET ACCESS</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile: compact CTA + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Show mini CTA on medium screens */}
          {!loading && !isAuthenticated && (
            <Button
              asChild
              size="sm"
              className="hidden sm:flex font-mono font-bold text-xs px-3 animate-red-glow"
            >
              <Link to="/register">GET ACCESS</Link>
            </Button>
          )}
          {!loading && isAuthenticated && (
            <Button asChild size="sm" className="hidden sm:flex font-mono font-bold text-xs px-3">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-md transition-colors"
            style={{ color: "oklch(0.72 0.22 142)" }}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="border-t px-4 pb-5 pt-3 lg:hidden"
          style={{ background: "oklch(0.07 0 0)", borderColor: "oklch(0.53 0.22 27 / 0.3)" }}
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-base font-medium font-mono border-b last:border-0 transition-colors"
                style={{ color: "oklch(0.72 0.22 142)", borderColor: "oklch(0.18 0.012 27)" }}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button asChild className="font-mono font-bold tracking-widest">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="font-mono border-primary/40">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild className="font-mono font-bold tracking-widest animate-red-glow">
                  <Link to="/register">GET ACCESS — FREE</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}