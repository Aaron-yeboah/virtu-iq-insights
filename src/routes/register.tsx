import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { LogoFull } from "@/components/brand/Logo";
import { AuthBackground } from "@/components/brand/AuthBackground";
import { supabase } from "@/integrations/supabase/client";
import { validateMobileNumber } from "@/lib/phone";
import { checkRegisterRateLimit, formatRetryAfter } from "@/lib/rateLimit";
import { cn } from "@/lib/utils";

type SearchParams = {
  ref?: string | undefined;
  partner?: boolean | undefined;
};

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const rawPartner = search["partner"];
    const isPartner =
      rawPartner === true ||
      rawPartner === 1 ||
      rawPartner === "1" ||
      rawPartner === "true" ||
      rawPartner === "";
    return {
      ref: typeof search["ref"] === "string" ? search["ref"] : undefined,
      partner: isPartner ? true : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Create Account — Virtu-IQ" },
      { name: "description", content: "Create your Virtu-IQ account, complete registration and get instant virtual verdicts from Virtu-IQ." },
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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const urlRef = (ref ?? "").trim().toUpperCase().slice(0, 16);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.session.user.id)
          .maybeSingle();

        if (!profile) {
          // Zombie session from a deleted account: wipe it so registration is fresh!
          await supabase.auth.signOut();
          return;
        }

        if (isPartnerInvite) {
          navigate({ to: "/partner-apply", replace: true });
        } else {
          navigate({ to: "/dashboard", replace: true });
        }
      }
    });
  }, [navigate, isPartnerInvite]);

  const score = strength(password);
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
  const colors = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const rl = checkRegisterRateLimit();
    if (!rl.allowed) {
      return setError(`Too many registration attempts. Please wait ${formatRetryAfter(rl.retryAfterSeconds)} before trying again.`);
    }

    if (fullName.trim().length < 2) return setError("Please enter your full name.");

    // Validate Ghana or Nigeria mobile phone
    const phoneVal = validateMobileNumber(phone);
    if (!phoneVal.isValid) {
      return setError(phoneVal.error ?? "Please enter a valid Ghana (10 digits) or Nigeria (11 digits) mobile number.");
    }

    if (password.length < 8) return setError("Passwords must be at least 8 characters.");

    const syntheticEmail = phoneVal.syntheticEmail;
    const finalReferralCode = isPartnerInvite ? "" : urlRef;

    setPending(true);

    // Clear any previous session first so new signup is 100% clean
    await supabase.auth.signOut().catch(() => {});

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: syntheticEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName.trim().slice(0, 80),
          phone: phoneVal.formattedDisplay,
          referral_code: finalReferralCode,
          partner_applicant: isPartnerInvite ? "true" : undefined,
        },
      },
    });

    if (signUpError) {
      setPending(false);
      return setError(signUpError.message);
    }

    if (isPartnerInvite) {
      let newUserId = data.user?.id ?? data.session?.user?.id ?? "";
      if (!data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password,
        });
        if (signInError) {
          setPending(false);
          return setError(signInError.message);
        }
        newUserId = signInData.user?.id ?? newUserId;
      }

      if (newUserId) {
        // 1. Call secure RPC to mark as partner applicant and waive registration fee
        await supabase.rpc("register_partner_applicant" as never, {
          _user_id: newUserId,
          _phone: phoneVal.formattedDisplay,
        } as never);

        // 2. Direct upsert fallback
        await Promise.allSettled([
          supabase
            .from("profiles")
            .update({
              partner_applicant: true,
              registration_paid: true,
              phone: phoneVal.formattedDisplay,
            })
            .eq("id", newUserId),
          supabase.from("partner_applications").upsert(
            {
              user_id: newUserId,
              audience: "Partner link invite",
              motivation: "Registered via partner invitation link",
              payout_method: phoneVal.country === "GH" ? "MTN MoMo" : "Bank transfer",
              payout_details: phoneVal.formattedDisplay,
              status: "pending",
            },
            { onConflict: "user_id" },
          ),
        ]);
      }

      setPending(false);
      setNotice("Partner account created — awaiting approval…");
      navigate({ to: "/partner-apply", replace: true });
      return;
    }

    // Log the new regular member straight in — the registration fee screen follows.
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password,
      });
      if (signInError) {
        setPending(false);
        return setError(signInError.message);
      }
    }
    setPending(false);
    setNotice("Account created — continuing to your registration…");
    navigate({ to: "/registration", replace: true });
  }

  return (
    <AuthBackground>
      <Link to="/" className="flex justify-center" aria-label="Virtu-IQ home">
        <div className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 shadow-lg">
          <LogoFull className="h-7" />
        </div>
      </Link>
      <div className="mt-6 sm:mt-8 rounded-xl border border-primary/30 bg-card p-4.5 sm:p-8 shadow-xl ring-1 ring-primary/10">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {isPartnerInvite ? "Partner registration" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isPartnerInvite
            ? "Create your account to access your partner hub immediately — no registration fee."
            : "Create your account with your mobile phone number to continue."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} maxLength={80} onChange={(e) => setFullName(e.target.value)} placeholder="Ama Mensah" required />
          </div>

          <PhoneInput
            id="phone"
            label="Mobile number"
            value={phone}
            onChange={(val) => setPhone(val)}
            required
          />

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
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        idx <= score ? colors[score] : "bg-muted",
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{labels[score]}</span>
              </div>
            )}
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
    </AuthBackground>
  );
}
