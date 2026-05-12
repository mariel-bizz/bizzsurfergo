import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestTeamJoin } from "@/lib/team-join.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/join-team/$ownerId")({
  head: () => ({
    meta: [{ title: "Join team" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: JoinTeamPage,
});

function JoinTeamPage() {
  const { ownerId } = useParams({ from: "/join-team/$ownerId" });
  const navigate = useNavigate();
  const join = useServerFn(requestTeamJoin);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const onJoin = async () => {
    setWorking(true);
    setError(null);
    try {
      await join({ data: { owner_id: ownerId } });
      setDone(true);
      toast.success("You've joined the team");
      setTimeout(() => navigate({ to: "/profile" }), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join team.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Join team on BizzSurfer Go</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {done && <p className="text-sm text-primary">You're in! Redirecting…</p>}
          {!done && (
            <p className="text-sm text-muted-foreground">
              You've been invited to join a team. Sign in to confirm and your account will be added to the team's records.
            </p>
          )}
          {!done && (
            authed ? (
              <Button className="w-full" onClick={onJoin} disabled={working}>
                {working ? "Joining…" : "Join team"}
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link to="/login" search={{ redirect: `/join-team/${ownerId}` }}>
                  Sign in to join
                </Link>
              </Button>
            )
          )}
        </CardContent>
      </Card>
    </main>
  );
}
