import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoFull } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { resolveLoginEmail } from "@/lib/auth.functions";
import { useServerFn } from "@tanstack/react-start";
import { AuthBackground } from "@/components/brand/AuthBackground";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — Virtu-IQ" },
      { name: "description", content: "Sign in to your Virtu-IQ workspace to analyze screenshots and review AI insight reports." },
      { property: "og:title", content: "Log In — Virtu-IQ" },
      { property: "og:description", content: "Sign in to your Virtu-IQ AI analysis workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const resolveEmail = useServerFn(resolveLoginEmail);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id);
        const roles = (roleData ?? []).map((r) => r.role);
        if (roles.includes("partner") && !roles.includes("admin")) {
          navigate({ to: "/partner", replace: true });
        } else {
          navigate({ to: "/dashboard", replace: true });
        }
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const raw = identifier.trim();
    const cleanDigits = raw.replace(/\D/g, "");
    if (cleanDigits.length < 9) {
      return setError("Please enter a valid phone number (e.g. 055 223 1466).");
    }
    if (password.length < 6) return setError("Please enter your password.");

    setPending(true);
    let loginEmail = raw;
    const isEmail = raw.includes("@");

    if (!isEmail) {
      let resolvedEmail: string | null = null;
      try {
        const resolved = await resolveEmail({ data: { phone: raw } });
        resolvedEmail = resolved.email;
      } catch {
        // Fall back to client-side RPC lookup if server function throws
      }

      if (!resolvedEmail) {
        try {
          const { data: rpcEmail } = await supabase.rpc("resolve_phone_email" as never, {
            p_phone: raw,
          } as never);
          const rpcStr = rpcEmail as unknown as string | null;
          if (typeof rpcStr === "string" && rpcStr.length > 0) {
            resolvedEmail = rpcStr;
          }
        } catch {
          // ignore
        }
      }

      // If not in database with an explicit custom email, use the synthetic phone email
      loginEmail = resolvedEmail || `${cleanDigits}@phone.virtu-iq.live`;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    // If first attempt with full digits fails, also try with 9-digit tail format (e.g. 552231466@...)
    let finalSignInData = signInData;
    if (signInError && !isEmail && cleanDigits.length >= 10) {
      const tailDigits = cleanDigits.slice(-9);
      const fallbackEmail = `${tailDigits}@phone.virtu-iq.live`;
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email: fallbackEmail,
        password,
      });
      if (!retryError) {
        finalSignInData = retryData;
      } else {
        setPending(false);
        return setError("Invalid phone number or password.");
      }
    } else if (signInError) {
      setPending(false);
      return setError(signInError.message === "Invalid login credentials" ? "Invalid phone number or password." : signInError.message);
    }

    setPending(false);

    if (finalSignInData.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", finalSignInData.user.id);
      const roles = (roleData ?? []).map((r) => r.role);
      if (roles.includes("partner") && !roles.includes("admin")) {
        navigate({ to: "/partner", replace: true });
        return;
      }
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <AuthBackground>
      <Link to="/" className="flex justify-center" aria-label="Virtu-IQ home">
        <div className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 shadow-lg">
          <LogoFull className="h-7" />
        </div>
      </Link>
      <div className="mt-8 rounded-xl border border-primary/30 bg-card p-6 shadow-xl ring-1 ring-primary/10 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Log in with your phone number to continue.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="055 223 1466"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
              {notice}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Logging in…
              </span>
            ) : (
              "Log In"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
