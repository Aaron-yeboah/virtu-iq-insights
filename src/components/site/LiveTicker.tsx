const tickerItems = [
  "🟢 SPBET-VIRT #3291 — HOME WIN EXPOSED ✓",
  "🔴 SPBET-VIRT #3292 — OVER 2.5 GOALS LOCKED ✓",
  "⚡ Algorithm breach confirmed — next 3 outcomes delivered",
  "🟢 SPBET-VIRT #3293 — BTTS YES EXPOSED ✓",
  "🔒 14,882 Instant Virtual Outcomes Exposed This Week",
  "🟢 SPBET-VIRT #3294 — AWAY WIN LOCKED ✓",
  "⚡ 99.1% Algorithm Accuracy Rate — Verified",
  "🟢 SPBET-VIRT #3295 — UNDER 1.5 GOALS EXPOSED ✓",
  "🔴 System breach active — Sportybet Virtuals feed tapped",
  "🟢 SPBET-VIRT #3296 — HOME WIN LOCKED ✓",
];

export function LiveTicker() {
  const items = [...tickerItems, ...tickerItems];

  return (
    <div className="relative overflow-hidden border-b border-border bg-black py-2">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-black to-transparent" />

      {/* Red left accent */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center pl-2">
        <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary-foreground font-mono">
          LIVE
        </span>
      </div>

      <div className="animate-ticker flex w-max gap-10 pl-20">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-2 text-xs font-medium whitespace-nowrap font-mono"
            style={{ color: "oklch(0.72 0.22 142)" }}
          >
            <span
              className="size-1.5 rounded-full animate-status-blink"
              style={{ background: i % 3 === 0 ? "oklch(0.53 0.22 27)" : "oklch(0.72 0.22 142)" }}
            />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
