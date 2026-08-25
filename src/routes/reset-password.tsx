import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoFull } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Virtu-IQ" },
      { name: "description", content: "Choose a new password for your Virtu-IQ account." },
      { property: "og:title", content: "Reset Password — Virtu-IQ" },
      { property: "og:description", content: "Set a new password and get back into your Virtu-IQ workspace." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) return setError(updateError.message);
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "linear-gradient(160deg, #C50F1F 0%, #E41827 40%, #9B0D17 100%)" }}>
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center" aria-label="Virtu-IQ home">
          <LogoFull className="h-7" />
        </Link>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Set a new password</h1>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
