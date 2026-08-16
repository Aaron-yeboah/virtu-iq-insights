import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: ReactNode;
  className?: string;
  /** If true, glitch runs continuously; otherwise only on hover */
  always?: boolean;
}

/**
 * GlitchText — Renders a headline with a colour-split glitch animation.
 * Uses two absolutely-positioned copies of the text:
 *   - layer-1: green, clipped and skewed on one axis
 *   - layer-2: red, clipped and skewed on the other axis
 * The main text flickers via animate-glitch-flicker.
 */
export function GlitchText({ children, className, always = true }: GlitchTextProps) {
  return (
    <span
      className={cn(
        "relative inline-block select-none",
        always && "animate-glitch-flicker",
        className
      )}
    >
      {/* Green glitch layer */}
      <span
        aria-hidden
        className="glitch-layer-1 pointer-events-none absolute inset-0 overflow-hidden"
      >
        {children}
      </span>

      {/* Red glitch layer */}
      <span
        aria-hidden
        className="glitch-layer-2 pointer-events-none absolute inset-0 overflow-hidden"
      >
        {children}
      </span>

      {/* Real visible text */}
      <span className="relative">{children}</span>
    </span>
  );
}
