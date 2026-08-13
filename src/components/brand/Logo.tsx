import fullLogo from "@/assets/virtu-iq-full.png.asset.json";
import symbolLogo from "@/assets/virtu-iq-symbol.png.asset.json";
import { cn } from "@/lib/utils";

export function LogoFull({ className }: { className?: string }) {
  return (
    <img
      src={fullLogo.url}
      alt="Virtu-IQ"
      className={cn("h-9 w-auto select-none", className)}
    />
  );
}

export function LogoSymbol({ className }: { className?: string }) {
  return (
    <img
      src={symbolLogo.url}
      alt="Virtu-IQ"
      className={cn("h-9 w-auto select-none", className)}
    />
  );
}