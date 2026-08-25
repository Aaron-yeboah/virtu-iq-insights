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
      className="sticky top-0 z-50 border-b transition-all"
      style={{
        background: "linear-gradient(180deg, #E41827, #C50F1F)",
        borderColor: "rgba(0, 0, 0, 0.12)",
        boxShadow: "0 4px 18px rgba(25, 30, 45, 0.15)",
      }}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo with white background badge in navbar */}
        <Link to="/" aria-label="Virtu-IQ home" className="flex items-center gap-2.5 group shrink-0">
        <div className="flex items-center rounded-lg bg-white px-2.5 py-1 shadow-sm transition-transform group-hover:scale-[1.02]">
            <LogoSymbol className="h-7 sm:h-8 object-contain" />
          </div>
          <span
            className="hidden sm:flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-white border-white/40 bg-white/10"
          >
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
        <div className="hidden items-center gap-3 lg:flex">
          {loading ? null : isAuthenticated ? (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide border border-emerald-400">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 hover:text-white">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-b from-[#26AF53] to-[#1F9E48] border border-[#2BBE5C] text-white font-bold tracking-wider hover:brightness-110 shadow-lg shadow-emerald-900/30">
                <Link to="/register">JOIN NOW</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile: compact CTA + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          {!loading && !isAuthenticated && (
            <Button
              asChild
              size="sm"
              className="hidden sm:flex bg-gradient-to-b from-[#26AF53] to-[#1F9E48] border border-[#2BBE5C] text-white font-bold text-xs px-3"
            >
              <Link to="/register">JOIN NOW</Link>
            </Button>
          )}
          {!loading && isAuthenticated && (
            <Button asChild size="sm" className="hidden sm:flex bg-emerald-600 text-white font-bold text-xs px-3">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-md text-white hover:bg-white/10 transition-colors"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="border-t px-4 pb-5 pt-3 lg:hidden text-white"
          style={{ background: "#C50F1F", borderColor: "rgba(255, 255, 255, 0.2)" }}
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-base font-semibold border-b border-white/15 text-white hover:bg-white/10 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button asChild className="bg-emerald-600 text-white font-bold tracking-widest">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="border-white/40 text-white hover:bg-white/10">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild className="bg-gradient-to-b from-[#26AF53] to-[#1F9E48] border border-[#2BBE5C] text-white font-bold tracking-widest">
                  <Link to="/register">JOIN NOW</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}