import { useEffect, useRef } from "react";

/**
 * MatrixRain — Canvas-based matrix cascade animation.
 * Renders green falling characters (digits, hex, katakana) on a black canvas.
 */
export function MatrixRain({ opacity = 0.06 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const FONT_SIZE = 13;
    const CHARS =
      "01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEF0123456789<>{}[]|!@#$%^&*";

    let width = 0;
    let height = 0;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      columns = Math.floor(width / FONT_SIZE);
      drops = Array.from({ length: columns }, () =>
        Math.floor(Math.random() * -60)
      );
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let animId: number;

    const draw = () => {
      // Faint white overlay creates the trailing fade on light background
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        if (drop === undefined) continue;

        const y = drop * FONT_SIZE;
        if (y < 0) {
          drops[i] = drop + 1;
          continue;
        }

        const char = CHARS[Math.floor(Math.random() * CHARS.length)] ?? "0";
        const x = i * FONT_SIZE;

        // Leading character — deep emerald green
        ctx.fillStyle = "#047857";
        ctx.fillText(char, x, y);

        // One step behind — vibrant matrix green
        if (drop > 1) {
          ctx.fillStyle = "#059669";
          const trailChar1 = CHARS[Math.floor(Math.random() * CHARS.length)] ?? "1";
          ctx.fillText(trailChar1, x, y - FONT_SIZE);
        }

        // Rest of trail — softer green
        if (drop > 2) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.6)";
          const trailChar2 = CHARS[Math.floor(Math.random() * CHARS.length)] ?? "0";
          ctx.fillText(trailChar2, x, y - FONT_SIZE * 2);
        }

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] = drop + 1;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    const timeout = setTimeout(() => {
      animId = requestAnimationFrame(draw);
    }, 80);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
