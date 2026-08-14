import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoFull } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): { ref?: string; partner?: boolean } => ({
    ...(typeof search["ref"] === "string" ? { ref: search["ref"].slice(0, 16) } : {}),
    ...(search["partner"] === "1" || search["partner"] === true ? { partner: true } : {}),
  }),
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
  const { ref, partner } = Route.useSearch();
  const isPartnerInvite = partner === true;
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
      if (data.session) navigate({ to: "/credits", replace: true });
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
    if (phone.trim().replace(/\D/g, "").length < 9) return setError("Please enter a valid phone number.");
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
          referral_code: isPartnerInvite ? "" : referral.trim().toUpperCase().slice(0, 16),
          ...(isPartnerInvite ? { partner_applicant: "true" } : {}),
        },
      },
    });
    setPending(false);
    if (signUpError) return setError(signUpError.message);

    if (isPartnerInvite) {
      if (!data.session) {
        return setNotice("Almost there — check your email to confirm your account.");
      }
      navigate({ to: "/partner-apply", replace: true });
      return;
    }

    // Members finish registration first, then log in — the registration fee
    // screen appears only after that first sign-in.
    if (data.session) await supabase.auth.signOut();
    setNotice("Account created — log in to continue and complete your registration fee.");
    window.setTimeout(() => navigate({ to: "/login", replace: true }), 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center" aria-label="Virtu-IQ home">
          <LogoFull className="h-10" />
        </Link>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isPartnerInvite ? "Partner registration" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isPartnerInvite
              ? "Create your account, then apply to become a Virtu-IQ partner — no registration fee."
              : "Start with 3 free analyses — no card required."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} maxLength={80} onChange={(e) => setFullName(e.target.value)} placeholder="Ama Mensah" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" autoComplete="tel" value={phone} maxLength={24} onChange={(e) => setPhone(e.target.value)} placeholder="024 000 0000" required />
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
            {!isPartnerInvite && (
              <div className="space-y-2">
                <Label htmlFor="referral">Referral code (optional)</Label>
                <Input id="referral" value={referral} maxLength={16} onChange={(e) => setReferral(e.target.value)} placeholder="ABCD1234" />
              </div>
            )}
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
