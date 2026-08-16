/**
 * FloatingParticles — Hacking-themed floating matrix characters.
 * Renders small green dots & binary chars that float upward.
 */
export function FloatingParticles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 7) % 100}%`,
    delay: `${(i * 0.6) % 6}s`,
    duration: `${4 + (i % 6) * 1.1}s`,
    size: 2 + (i % 3),
    char: ["0", "1", "·", "◆", "▪"][i % 5],
    isChar: i % 4 === 0,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute font-mono text-[oklch(0.72_0.22_142)] select-none"
          style={{
            left: p.left,
            bottom: "-10px",
            fontSize: p.isChar ? "10px" : `${p.size}px`,
            width: p.isChar ? "auto" : p.size,
            height: p.isChar ? "auto" : p.size,
            borderRadius: p.isChar ? 0 : "50%",
            background: p.isChar ? "transparent" : "oklch(0.72 0.22 142 / 0.4)",
            animation: `float-particle ${p.duration} ease-in-out ${p.delay} infinite`,
            opacity: 0.5 + (p.id % 3) * 0.15,
          }}
        >
          {p.isChar ? p.char : null}
        </span>
      ))}
    </div>
  );
}
