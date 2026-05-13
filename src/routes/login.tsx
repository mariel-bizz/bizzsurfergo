import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  head: () => ({
    meta: [{ title: "Sign in" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isUpgradeFlow = redirect.startsWith("/pricing");
  const notifySuccess = (mode: "signin" | "signup") => {
    if (isUpgradeFlow) {
      toast.success(
        mode === "signup" ? "Account created — ready to upgrade" : "Welcome back — ready to upgrade",
      );
    } else {
      toast.success(mode === "signup" ? "Account created" : "Welcome back");
    }
  };

  useEffect(() => {
    // Restore existing session on mount (handles OAuth redirect return).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect });
    });
    // Subscribe to auth state changes so a session created by an OAuth
    // redirect (Apple/Google) is picked up immediately on this page.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        notifySuccess("signin");
        navigate({ to: redirect });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, redirect]);

  // Map raw OAuth/provider errors to actionable, user-friendly messages.
  const friendlyOAuthError = (
    provider: "google" | "apple" | "azure" | "linkedin_oidc",
    raw: unknown,
  ): string => {
    const msg = raw instanceof Error ? raw.message : String(raw ?? "");
    const lower = msg.toLowerCase();
    const label =
      provider === "apple"
        ? "Apple"
        : provider === "google"
          ? "Google"
          : provider === "azure"
            ? "Microsoft"
            : "LinkedIn";

    if (
      lower.includes("popup_closed") ||
      lower.includes("user_cancelled") ||
      lower.includes("user canceled") ||
      lower.includes("user cancelled") ||
      lower.includes("canceled") ||
      lower.includes("cancelled") ||
      lower.includes("access_denied")
    ) {
      return `${label} sign-in was canceled. Please try again.`;
    }
    if (lower.includes("invalid_nonce") || lower.includes("nonce")) {
      return `${label} rejected the sign-in (invalid nonce). Clear cookies for this site and retry; if it persists, the provider's client secret may need to be regenerated.`;
    }
    if (
      lower.includes("invalid_client") ||
      lower.includes("invalid client") ||
      lower.includes("client_secret") ||
      lower.includes("invalid_grant")
    ) {
      return `${label} sign-in is misconfigured (client credentials). The Services ID / client secret JWT may be wrong or expired — regenerate it in the backend auth settings.`;
    }
    if (
      lower.includes("redirect_uri") ||
      lower.includes("redirect uri") ||
      lower.includes("invalid_redirect") ||
      lower.includes("callback")
    ) {
      return `${label} callback URL is not allowed. Add this app's domain and the backend callback URL to the ${label} provider configuration, then retry.`;
    }
    if (lower.includes("email") && lower.includes("exist")) {
      return `An account with this email already exists. Sign in with your original method first — accounts are linked automatically when the email is verified.`;
    }
    if (lower.includes("network") || lower.includes("failed to fetch")) {
      return `Network error reaching ${label}. Check your connection and try again.`;
    }
    return msg || `${label} sign-in failed. Please try again.`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${redirect}` },
        });
        if (error) throw error;
        setInfo("Check your email to confirm your account.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("If that email exists, a reset link is on its way.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: redirect });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}${redirect}`,
      });
      if (result.error) {
        setError(friendlyOAuthError(provider, result.error));
        return;
      }
      if (result.redirected) return;
      navigate({ to: redirect });
    } catch (err) {
      setError(friendlyOAuthError(provider, err));
    } finally {
      setLoading(false);
    }
  };

  const oauthSupabase = async (provider: "azure" | "linkedin_oidc") => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirect}`,
          ...(provider === "azure" ? { scopes: "email openid profile" } : {}),
        },
      });
      if (error) throw error;
      // Browser will redirect to provider.
    } catch (err) {
      setError(friendlyOAuthError(provider, err));
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2">
          <CardTitle>
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset your password"}
          </CardTitle>
          {isUpgradeFlow && mode !== "forgot" && (
            <p className="text-sm text-muted-foreground">
              {mode === "signup"
                ? "Create your account to continue with your upgrade."
                : "Sign in to continue with your upgrade."}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-primary">{info}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "…"
                : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Sign up"
                    : "Send reset link"}
            </Button>
          </form>
          {mode !== "forgot" && (
            <>
              <Button variant="outline" className="w-full" onClick={() => oauth("google")} disabled={loading}>
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full" onClick={() => oauth("apple")} disabled={loading}>
                Continue with Apple
              </Button>
              <Button variant="outline" className="w-full" onClick={() => oauthSupabase("azure")} disabled={loading}>
                Continue with Microsoft
              </Button>
              <Button variant="outline" className="w-full" onClick={() => oauthSupabase("linkedin_oidc")} disabled={loading}>
                Continue with LinkedIn
              </Button>
            </>
          )}
          <button
            type="button"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setError(null);
              setInfo(null);
              setMode(mode === "signin" ? "signup" : "signin");
            }}
          >
            {mode === "forgot"
              ? "Back to sign in"
              : mode === "signin"
                ? "Need an account? Sign up"
                : "Have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
