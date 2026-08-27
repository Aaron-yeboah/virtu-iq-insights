import { cn } from "@/lib/utils";

// Logos are served from /public so they work on any host (Vercel, Lovable, etc.)
// without depending on the Lovable-specific /__l5e/assets-v1/ CDN path.
const FULL_LOGO = "/virtu-iq-full.png";
const SYMBOL_LOGO = "/virtu-iq-symbol.png";

type LogoProps = { className?: string } & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

export function LogoFull({ className, ...rest }: LogoProps) {
  return (
    <img
      src={FULL_LOGO}
      alt="Virtu-IQ"
      loading="eager"
      decoding="async"
      className={cn("h-7 w-auto select-none", className)}
      {...rest}
    />
  );
}

export function LogoSymbol({ className, ...rest }: LogoProps) {
  return (
    <img
      src={SYMBOL_LOGO}
      alt="Virtu-IQ"
      loading="eager"
      decoding="async"
      className={cn("h-9 w-auto select-none", className)}
      {...rest}
    />
  );
}

/**
 * Large faint-white Virtu-IQ symbol used as a watermark inside brand-blue cards.
 * `brightness-0 invert` flattens the mark to pure white so it reads as a soft
 * embossed watermark rather than a pasted logo.
 */
export function LogoWatermark({ className, ...rest }: LogoProps) {
  return (
    <img
      src={SYMBOL_LOGO}
      alt=""
      aria-hidden
      className={cn(
        "pointer-events-none absolute select-none brightness-0 invert",
        "-right-8 -bottom-10 h-64 w-auto opacity-[0.12] sm:h-80 sm:-right-10 sm:-bottom-14",
        className,
      )}
      {...rest}
    />
  );
}