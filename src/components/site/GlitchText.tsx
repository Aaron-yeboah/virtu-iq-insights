import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: ReactNode;
  className?: string;
  /** If true, animation runs continuously; otherwise only on hover */
  always?: boolean;
}

/**
 * GlitchText — Renders headline text with active glitch animations
 * moving around and across the letters (cyan/green and red dual split).
 */
export function GlitchText({ children, className, always = true }: GlitchTextProps) {
  return (
    <span
      className={cn(
        "relative inline-block select-none font-black",
        always && "animate-glitch-flicker",
        className
      )}
    >
      {/* Green glitch layer moving around the letters */}
      <span
        aria-hidden
        className="glitch-layer-1 pointer-events-none absolute inset-0 overflow-hidden"
      >
        {children}
      </span>

      {/* Red glitch layer moving around the letters */}
      <span
        aria-hidden
        className="glitch-layer-2 pointer-events-none absolute inset-0 overflow-hidden"
      >
        {children}
      </span>

      {/* Real visible text */}
      <span className="relative inline">{children}</span>
    </span>
  );
}


