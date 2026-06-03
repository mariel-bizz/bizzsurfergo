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
  validateSearch: (s: Record<string, unknown>) => {
    const raw = typeof s.redirect === "string" ? s.redirect : "";
    const safe =
      raw.startsWith("/") &&
      !raw.startsWith("//") &&
      !raw.startsWith("/\\") &&
      !raw.includes("\\");
    const rawError = typeof s.error === "string" ? s.error.slice(0, 300) : "";
    return { redirect: safe ? raw : "/", error: rawError };
  },
  head: () => ({
    meta: [
      { title: "Sign in — BizzSurfer Go!" },
      {
        name: "description",
        content:
          "Sign in or create your BizzSurfer Go! account to access Agentic AI tools for business transformation.",
      },
      { property: "og:title", content: "Sign in — BizzSurfer Go!" },
      {
        property: "og:description",
        content:
          "Access your BizzSurfer Go! account to use Agentic AI for enterprise transformation.",
      },
      { property: "og:url", content: "https://go.bizzsurfer.ai/login" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect, error: searchError } = useSearch({ from: "/login" });
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchError || null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [showDiag, setShowDiag] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ userId: string; email: string } | null>(null);

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

  // Computed once: the exact LinkedIn callback URL for the current host —
  // shown in the diagnostics panel so you can paste it into the LinkedIn
  // app's "Authorized redirect URLs" list when something is misconfigured.
  const linkedInCallbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/linkedin/callback`
      : "";

  useEffect(() => {
    // Restore existing session on mount (handles OAuth redirect return).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionInfo({
          userId: data.session.user.id,
          email: data.session.user.email ?? "",
        });
        // Brief on-page confirmation, then navigate.
        setTimeout(() => navigate({ to: redirect }), 600);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        try {
          const flagKey = `bizzsurfer.reset.${session.user.id}`;
          if (!localStorage.getItem(flagKey)) {
            localStorage.removeItem("bizzsurfer.gochat.config");
            localStorage.setItem(flagKey, "1");
          }
        } catch { /* ignore */ }
        setSessionInfo({
          userId: session.user.id,
          email: session.user.email ?? "",
        });
        notifySuccess("signin");
        setTimeout(() => navigate({ to: redirect }), 600);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, redirect]);

  // Surface any error from the LinkedIn callback as a toast on mount.
  useEffect(() => {
    if (searchError) {
      toast.error(`LinkedIn sign-in failed: ${searchError}`);
      setShowDiag(true);
    }
  }, [searchError]);

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
        toast.success("Welcome to BizzSurfer Go! 🎉 Check your email to confirm your account.");
        setInfo("Welcome aboard! Check your email to confirm your account, then sign in to start your Agentic AI journey.");
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
              <Button
                variant="outline"
                className="w-full"
                disabled={loading || linkedInLoading}
                onClick={() => {
                  setError(null);
                  setInfo("Redirecting you to LinkedIn…");
                  setLinkedInLoading(true);
                  setLoading(true);
                  window.location.href = `/api/auth/linkedin/start?redirect=${encodeURIComponent(redirect)}`;
                }}
              >
                {linkedInLoading ? "Connecting to LinkedIn…" : "Continue with LinkedIn"}
              </Button>
              {sessionInfo && (
                <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
                  <p className="font-semibold text-primary">✓ Signed in — session active</p>
                  <p className="mt-1 truncate text-muted-foreground">{sessionInfo.email}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">id: {sessionInfo.userId}</p>
                </div>
              )}
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

          {/* OAuth diagnostics panel — surfaces the exact LinkedIn callback
              URL we use for this host, plus the most recent error returned
              by /api/auth/linkedin/callback (passed via ?error=). */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              onClick={() => setShowDiag((v) => !v)}
            >
              {showDiag ? "Hide" : "Show"} OAuth diagnostics
            </button>
            {showDiag && (
              <div className="mt-2 space-y-2 rounded-md border border-border bg-muted/40 p-3 text-xs">
                <div>
                  <p className="font-semibold text-foreground">Expected LinkedIn redirect URL</p>
                  <p className="break-all font-mono text-[11px] text-muted-foreground">
                    {linkedInCallbackUrl || "(unavailable)"}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    This exact URL must be listed in your LinkedIn app's
                    Authorized redirect URLs.
                  </p>
                </div>
                {searchError && (
                  <div>
                    <p className="font-semibold text-destructive">Last callback error</p>
                    <p className="break-words font-mono text-[11px] text-destructive/90">
                      {searchError}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
