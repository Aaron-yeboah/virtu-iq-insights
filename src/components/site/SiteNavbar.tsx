import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Terminal, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoFull, LogoSymbol } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  return (
    <header
      className="sticky top-0 z-50 border-b transition-all"
      style={{
        background: "linear-gradient(180deg, #E41827, #C50F1F)",
        borderColor: "rgba(0, 0, 0, 0.12)",
        boxShadow: "0 4px 18px rgba(25, 30, 45, 0.15)",
      }}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo with white background badge */}
        <Link to="/" aria-label="Virtu-IQ home" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex items-center rounded-lg bg-white px-2.5 py-1 shadow-sm transition-transform group-hover:scale-[1.02]">
            <LogoSymbol className="h-7 sm:h-8 object-contain" />
          </div>
          <span className="hidden sm:flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-white border-white/40 bg-white/10">
            <Terminal className="size-2.5 text-white" />
            ONLINE
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-xs font-semibold uppercase tracking-wider text-white/90 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {loading ? null : isAuthenticated ? (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide border border-emerald-400">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white text-xs font-bold uppercase tracking-wider h-9 px-4">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-b from-[#26AF53] to-[#1F9E48] border border-[#2BBE5C] text-white font-bold tracking-wider hover:brightness-110 shadow-lg shadow-emerald-900/30 h-9 px-5">
                <Link to="/register">JOIN NOW</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile & Tablet CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
          {!loading && !isAuthenticated && (
            <>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white text-xs font-bold px-2.5 sm:px-3"
              >
                <Link to="/login">Log In</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-8 bg-gradient-to-b from-[#26AF53] to-[#1F9E48] border border-[#2BBE5C] text-white font-bold text-xs px-2.5 sm:px-3"
              >
                <Link to="/register">JOIN</Link>
              </Button>
            </>
          )}
          {!loading && isAuthenticated && (
            <Button asChild size="sm" className="h-8 bg-emerald-600 text-white font-bold text-xs px-3">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-9 sm:size-10 items-center justify-center rounded-md text-white hover:bg-white/10 transition-colors ml-1 touch-manipulation"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer — redesigned ── */}
      {open && (
        <div
          className="lg:hidden"
          style={{
            background: "linear-gradient(180deg, #B00D1A 0%, #8B0913 100%)",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          }}
        >
          {/* Nav links with chevrons */}
          <nav aria-label="Mobile navigation" className="px-4 pt-3 pb-1">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-3.5 text-sm font-semibold text-white/90 hover:text-white transition-colors"
                style={{
                  borderBottom: i < links.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none",
                }}
              >
                {l.label}
                <ChevronRight className="size-4 text-white/50" />
              </a>
            ))}
          </nav>

          {/* Divider */}
          <div className="mx-4 my-2 border-t border-white/15" />

          {/* CTA buttons */}
          <div className="px-4 pb-5 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg py-3 text-sm font-bold tracking-wider text-white transition-all"
                style={{ background: "linear-gradient(135deg, #059669, #047857)", border: "1px solid #10b981" }}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-lg py-3 text-sm font-bold tracking-widest text-white transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #26AF53, #1F9E48)", border: "1px solid #2BBE5C" }}
                >
                  JOIN NOW — FREE ACCOUNT
                </Link>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-lg py-3 text-sm font-semibold tracking-wide transition-all"
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "white",
                  }}
                >
                  Log In
                </Link>
              </>
            )}
          </div>

          {/* Status footer */}
          <div
            className="flex items-center justify-center gap-1.5 py-2 text-[10px] font-mono font-bold tracking-widest"
            style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.5)" }}
          >
            <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SYSTEM ONLINE · SECURE CONNECTION
          </div>
        </div>
      )}
    </header>
  );
}