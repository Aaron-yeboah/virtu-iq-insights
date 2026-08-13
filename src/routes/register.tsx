import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoFull } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): { ref?: string } =>
    typeof search["ref"] === "string" ? { ref: search["ref"].slice(0, 16) } : {},
  head: () => ({
    meta: [
      { title: "Create Account — Virtu-IQ" },
      { name: "description", content: "Create your Virtu-IQ account and get 3 free screenshot analyses to start turning visuals into insight." },
      { property: "og:title", content: "Create Account — Virtu-IQ" },
      { property: "og:description", content: "Join Virtu-IQ and start analyzing screenshots with AI." },
    ],
  }),
  component: RegisterPage,
});

function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function RegisterPage() {
  const navigate = useNavigate();
  const { ref } = Route.useSearch();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState(ref ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const score = strength(password);
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (!email.includes("@")) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Passwords must be at least 8 characters.");

    setPending(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName.trim().slice(0, 80),
          phone: phone.trim().slice(0, 24),
          referral_code: referral.trim().toUpperCase().slice(0, 16),
        },
      },
    });
    setPending(false);
    if (signUpError) return setError(signUpError.message);
    if (!data.session) {
      return setNotice("Almost there — check your email to confirm your account.");
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return setError("Google sign-up failed. Please try again.");
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center" aria-label="Virtu-IQ home">
          <LogoFull className="h-10" />
        </Link>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Start with 3 free analyses — no card required.
          </p>

          <Button type="button" variant="outline" className="mt-6 w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} maxLength={80} onChange={(e) => setFullName(e.target.value)} placeholder="Ama Mensah" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" value={phone} maxLength={24} onChange={(e) => setPhone(e.target.value)} placeholder="024 000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
              {password && (
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full",
                          i < score ? "bg-primary" : "bg-border",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{labels[score]}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral">Referral code (optional)</Label>
              <Input id="referral" value={referral} maxLength={16} onChange={(e) => setReferral(e.target.value)} placeholder="ABCD1234" />
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {notice && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
