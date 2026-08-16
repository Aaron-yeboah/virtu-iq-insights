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
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/credits", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const raw = identifier.trim();
    const isEmail = raw.includes("@");
    if (!isEmail && raw.replace(/\D/g, "").length < 9) {
      return setError("Enter your email address or phone number.");
    }
    if (password.length < 6) return setError("Please enter your password.");

    setPending(true);
    let loginEmail = raw;
    if (!isEmail) {
      const resolved = await resolveEmail({ data: { phone: raw } });
      if (!resolved.email) {
        setPending(false);
        return setError("No account found for that phone number.");
      }
      loginEmail = resolved.email;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    setPending(false);
    if (signInError) return setError(signInError.message);
    navigate({ to: "/credits", replace: true });
  }

  async function handleReset() {
    setError(null);
    if (!identifier.includes("@")) return setError("Enter your email address first.");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) return setError(resetError.message);
    setNotice("Check your inbox for a password reset link.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center" aria-label="Virtu-IQ home">
          <LogoFull className="h-10" />
        </Link>
        <div className="mt-8 rounded-xl border border-border/60 bg-card/95 p-6 shadow-[var(--shadow-lift)] ring-1 ring-white/5 backdrop-blur-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Log in to continue your analysis work.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email or phone number</Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@company.com or 024 000 0000"
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
            <div className="flex justify-end">
              <button type="button" onClick={handleReset} className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Log In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Virtu-IQ?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
