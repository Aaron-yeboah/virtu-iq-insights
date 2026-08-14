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