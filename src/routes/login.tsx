import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Restore existing session on mount (handles OAuth redirect return).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect });
    });
    // Subscribe to auth state changes so a session created by an OAuth
    // redirect (Apple/Google) is picked up immediately on this page.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        navigate({ to: redirect });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, redirect]);

  // Map raw OAuth/provider errors to actionable, user-friendly messages.
  const friendlyOAuthError = (provider: "google" | "apple", raw: unknown): string => {
    const msg = raw instanceof Error ? raw.message : String(raw ?? "");
    const lower = msg.toLowerCase();
    const label = provider === "apple" ? "Apple" : "Google";

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
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${redirect}` },
        });
        if (error) throw error;
        setError("Check your email to confirm your account.");
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
        setError(result.error instanceof Error ? result.error.message : `${provider} sign-in failed`);
        return;
      }
      if (result.redirected) return;
      navigate({ to: redirect });
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <Button variant="outline" className="w-full" onClick={() => oauth("google")} disabled={loading}>
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full" onClick={() => oauth("apple")} disabled={loading}>
            Continue with Apple
          </Button>
          <button
            type="button"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
