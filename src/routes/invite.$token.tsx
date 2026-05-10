import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptTeamInvite } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [{ title: "Accept invite" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = useParams({ from: "/invite/$token" });
  const navigate = useNavigate();
  const accept = useServerFn(acceptTeamInvite);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [invite, setInvite] = useState<{ email: string; status: string; name: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase
      .rpc("get_team_invite", { _token: token })
      .then(({ data, error }) => {
        if (error) return setError(error.message);
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return setError("This invite link is no longer valid.");
        setInvite(row);
      });
  }, [token]);

  const onAccept = async () => {
    setWorking(true);
    try {
      await accept({ data: { token } });
      setDone(true);
      toast.success("Invite accepted");
      setTimeout(() => navigate({ to: "/profile" }), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept invite.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Team invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && !invite && <p className="text-sm text-muted-foreground">Loading invite…</p>}
          {invite && (
            <>
              <p className="text-sm">
                You've been invited to join a team on BizzSurfer Go as
                {" "}
                <span className="font-medium">{invite.email}</span>.
              </p>
              {invite.status === "active" && !done && (
                <p className="text-sm text-muted-foreground">This invite has already been accepted.</p>
              )}
              {invite.status === "revoked" && (
                <p className="text-sm text-destructive">This invite was revoked by the owner.</p>
              )}
              {done && <p className="text-sm text-primary">You're in! Redirecting…</p>}
              {invite.status === "pending" && !done && (
                authed ? (
                  <Button className="w-full" onClick={onAccept} disabled={working}>
                    {working ? "Accepting…" : "Accept invite"}
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link to="/login" search={{ redirect: `/invite/${token}` }}>
                      Sign in to accept
                    </Link>
                  </Button>
                )
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
