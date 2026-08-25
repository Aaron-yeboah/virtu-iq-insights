import { useEffect, useState } from "react";
import { LogoSymbol } from "@/components/brand/Logo";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("viq-splash") === "1") {
      setVisible(false);
      return;
    }
    const fadeTimer = setTimeout(() => setFading(true), 350);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("viq-splash", "1");
    }, 600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--color-accent),transparent_65%)]" />
      <div className="relative flex flex-col items-center gap-6">
        <LogoSymbol className="h-20 animate-[pulse_1.6s_ease-in-out_infinite]" />
        <p className="text-sm font-medium tracking-[0.3em] text-muted-foreground uppercase">
          Virtu-IQ
        </p>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/3 animate-[splash-slide_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}