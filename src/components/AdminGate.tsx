import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type State =
  | { kind: "loading" }
  | { kind: "anonymous" }
  | { kind: "forbidden"; email: string }
  | { kind: "error"; message: string }
  | { kind: "authorized" };

async function withTimeout<T>(promise: PromiseLike<T>, message: string, ms = 8000): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      setState({ kind: "loading" });
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          "The sign-in check timed out. Refresh the page or sign in again.",
        );
        if (cancelled) return;
        if (!session?.user) {
          setState({ kind: "anonymous" });
          return;
        }
        const { data, error } = await withTimeout(
          supabase.rpc("has_role", {
            _user_id: session.user.id,
            _role: "admin",
          }),
          "The admin permission check timed out. Please try again.",
        );
        if (cancelled) return;
        if (error) {
          setState({ kind: "error", message: error.message });
        } else if (!data) {
          setState({ kind: "forbidden", email: session.user.email ?? "" });
        } else {
          setState({ kind: "authorized" });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: error instanceof Error ? error.message : "Unable to check admin access.",
          });
        }
      }
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </main>
    );
  }

  if (state.kind === "anonymous") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">This page is restricted to admins.</p>
            <Button asChild className="w-full">
              <Link to="/login" search={{ redirect: location.pathname }}>Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (state.kind === "forbidden") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {state.email} is signed in but not an admin.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Access check failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{state.message}</p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login" search={{ redirect: location.pathname }}>Sign in again</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
