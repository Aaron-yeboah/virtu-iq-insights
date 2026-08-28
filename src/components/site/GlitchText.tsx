import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: ReactNode;
  className?: string;
  /** If true, animation runs continuously; otherwise only on hover */
  always?: boolean;
}

/**
 * GlitchText — Renders headline text with a professional shimmer animation.
 * A subtle highlight sweep glides across the text continuously,
 * giving a premium "data breach" aesthetic without chaotic flickering.
 */
export function GlitchText({ children, className, always = true }: GlitchTextProps) {
  return (
    <span
      className={cn(
        "relative inline-block select-none",
        className
      )}
      style={{
        backgroundImage: "linear-gradient(110deg, currentColor 35%, rgba(255,255,255,0.85) 50%, currentColor 65%)",
        backgroundSize: "250% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: always ? "shimmer-text 3s ease-in-out infinite" : "none",
      }}
    >
      {children}
    </span>
  );
}

