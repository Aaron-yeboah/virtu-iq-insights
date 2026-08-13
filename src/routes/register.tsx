import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoFull } from "@/components/brand/Logo";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — Virtu-IQ" },
      { name: "description", content: "Create a Virtu-IQ account to upload screenshots and receive structured AI analysis reports." },
      { property: "og:title", content: "Create Account — Virtu-IQ" },
      { property: "og:description", content: "Join Virtu-IQ and turn screenshots into intelligent insights." },
    ],
  }),
  component: RegisterPage,
});

function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const score = useMemo(() => strengthOf(form.password), [form.password]);
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center" aria-label="Virtu-IQ home">
          <LogoFull className="h-10" />
        </Link>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Start analyzing screenshots with Virtu-IQ.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.fullName.trim().length < 2) return setError("Please enter your full name.");
              if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid email address.");
              if (form.phone.trim().length < 7) return setError("Please enter a valid phone number.");
              if (score < 2) return setError("Please choose a stronger password.");
              if (form.password !== form.confirm) return setError("Passwords do not match.");
              setError("Accounts aren't connected yet. Secure sign-up arrives with the next build step.");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={form.fullName} onChange={set("fullName")} autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="new-password"
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex h-1.5 flex-1 gap-1" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-full flex-1 rounded-full ${i < score ? "bg-primary" : "bg-border"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{labels[score]}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type={show ? "text" : "password"}
                value={form.confirm}
                onChange={set("confirm")}
                autoComplete="new-password"
                required
              />
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full">
              Create Account
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