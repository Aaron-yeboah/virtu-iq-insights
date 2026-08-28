import { ReactNode } from "react";
import { LogoSymbol } from "@/components/brand/Logo";

export function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-6 sm:px-4 sm:py-12 bg-gradient-to-br from-[#B50D19] via-[#E41827] to-[#7F0A12]">
      {/* Dynamic Animated Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:28px_28px] animate-grid-drift"
        aria-hidden="true"
      />

      {/* Floating Glowing Ambient Orbs */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-white/20 blur-3xl animate-pulse"
        style={{ animationDuration: "7s" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -right-32 size-96 rounded-full bg-black/40 blur-3xl animate-pulse"
        style={{ animationDuration: "9s" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/4 size-80 rounded-full bg-white/15 blur-2xl animate-pulse"
        style={{ animationDuration: "6s" }}
        aria-hidden="true"
      />

      {/* Large Decorative Faint Logo Watermark with Drift Animation */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-96 w-96 opacity-[0.08] animate-logo-drift select-none"
        aria-hidden="true"
      >
        <LogoSymbol className="h-full w-full brightness-0 invert" />
      </div>
      <div
        className="pointer-events-none absolute -bottom-16 -left-12 h-80 w-80 opacity-[0.06] -rotate-12 select-none"
        aria-hidden="true"
      >
        <LogoSymbol className="h-full w-full brightness-0 invert" />
      </div>

      {/* Ambient Glowing Tech Rings */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/10 size-64 rounded-full border border-white/10 opacity-30 animate-pulse-ring"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/10 size-72 rounded-full border border-white/10 opacity-20 animate-pulse-ring"
        style={{ animationDelay: "1s" }}
        aria-hidden="true"
      />

      {/* Futuristic Floating Particles / Sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span
          className="absolute top-1/4 left-[15%] size-2 rounded-full bg-white/50 blur-[1px] animate-ping"
          style={{ animationDuration: "3s" }}
        />
        <span
          className="absolute top-3/4 left-[10%] size-1.5 rounded-full bg-white/60 blur-[1px] animate-ping"
          style={{ animationDuration: "4.5s" }}
        />
        <span
          className="absolute top-1/3 right-[18%] size-2 rounded-full bg-white/50 blur-[1px] animate-ping"
          style={{ animationDuration: "3.8s" }}
        />
        <span
          className="absolute top-2/3 right-[12%] size-1.5 rounded-full bg-white/40 blur-[1px] animate-ping"
          style={{ animationDuration: "5s" }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md animate-rise">
        {children}
      </div>
    </main>
  );
}
