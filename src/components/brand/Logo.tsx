import fullLogo from "@/assets/virtu-iq-full.png";
import symbolLogo from "@/assets/virtu-iq-symbol.png";
import { cn } from "@/lib/utils";

type LogoProps = { className?: string } & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

export function LogoFull({ className, ...rest }: LogoProps) {
  return (
    <img
      src={fullLogo}
      alt="Virtu-IQ"
      className={cn("h-9 w-auto select-none", className)}
      {...rest}
    />
  );
}

export function LogoSymbol({ className, ...rest }: LogoProps) {
  return (
    <img
      src={symbolLogo}
      alt="Virtu-IQ"
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
      src={symbolLogo}
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