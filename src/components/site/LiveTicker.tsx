const tickerItems = [
  "⚽ Man City vs Arsenal — Verdict LOCKED ✓",
  "⚽ Barcelona vs Real Madrid — 3 Verdicts Delivered",
  "🏆 Champions League Finals — Expert Pick Confirmed",
  "⚽ Liverpool vs Chelsea — Verdict LOCKED ✓",
  "🔒 10,247 Verdicts Delivered This Week",
  "⚽ PSG vs Bayern Munich — Certified Result",
  "✅ 98.7% User Satisfaction Rate",
  "⚽ Juventus vs AC Milan — Verdict LOCKED ✓",
  "🏆 Europa League — Expert Verdicts Available",
  "⚽ Dortmund vs Leipzig — 5 Verdicts Delivered",
];

export function LiveTicker() {
  // Duplicate items for seamless infinite scroll
  const items = [...tickerItems, ...tickerItems];

  return (
    <div className="relative overflow-hidden border-b border-border bg-primary/5 py-2">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />

      <div className="animate-ticker flex w-max gap-8">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap"
          >
            <span className="size-1.5 rounded-full bg-green-500 animate-status-blink" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
