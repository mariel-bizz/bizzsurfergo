import { useEffect, useState } from "react";
import { useGame } from "../AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trophy,
  Flame,
  Zap,
  MessageCircle,
  LogIn,
  Save,
  UserPlus,
  Trash2,
  Mail,
  Sparkles,
  X,
  Link as LinkIcon,
  Copy,
  Send,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyPreferences,
  upsertMyPreferences,
  listMyTeam,
  inviteTeamMember,
  removeTeamMember,
  updateTeamMember,
} from "@/lib/profile.functions";

const TOPIC_OPTIONS = [
  "Agentic AI",
  "Board & C-suite Strategy",
  "Operating Model Redesign",
  "AI Governance & Risk",
  "People & Change",
  "Customer Experience",
  "Data & Platforms",
  "Finance Transformation",
  "Sustainability",
  "GenAI for Sales",
  "Procurement & Supply Chain",
  "Cybersecurity",
];

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
];

type TeamRow = {
  id: string;
  email: string;
  name: string | null;
  role: "member" | "admin";
  status: "pending" | "active" | "revoked";
  invited_at: string;
  invite_token: string;
  accepted_at: string | null;
};

export function ProfileTab() {
  const navigate = useNavigate();
  const game = useGame();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setAuthed(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (authed === null) {
    return <div className="px-5 py-10 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!authed) {
    return (
      <div className="px-5 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-primary" /> Sign in to view your profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Track XP, manage your transformation interests, languages, and invite
              teammates to BizzSurfer Go!
            </p>
            <Button
              className="w-full"
              onClick={() => navigate({ to: "/login", search: { redirect: "/profile" } })}
            >
              Sign in or create account
            </Button>
          </CardContent>
        </Card>
        <GameSummary />
      </div>
    );
  }

  return <SignedInProfile />;
}

function SignedInProfile() {
  const game = useGame();
  const navigate = useNavigate();
  const fetchPrefs = useServerFn(getMyPreferences);
  const savePrefs = useServerFn(upsertMyPreferences);
  const fetchTeam = useServerFn(listMyTeam);
  const invite = useServerFn(inviteTeamMember);
  const removeMember = useServerFn(removeTeamMember);
  const updateMember = useServerFn(updateTeamMember);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [insightsDigest, setInsightsDigest] = useState(true);

  const [team, setTeam] = useState<TeamRow[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [emailChips, setEmailChips] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState("");
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchPrefs(), fetchTeam()])
      .then(([prefs, t]) => {
        if (cancelled) return;
        setEmail(prefs.account.email);
        setOwnerId(prefs.account.id);
        const p = prefs.preferences;
        if (p) {
          setDisplayName(p.display_name ?? "");
          setJobTitle(p.job_title ?? "");
          setCompany(p.company ?? "");
          setTopics(p.topics ?? []);
          setLanguages(p.languages?.length ? p.languages : ["en"]);
          setEmailUpdates(p.email_updates);
          setEventReminders(p.event_reminders);
          setInsightsDigest(p.insights_digest);
        }
        setTeam((t.team ?? []) as TeamRow[]);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load profile"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fetchPrefs, fetchTeam]);

  const toggleTopic = (t: string) =>
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleLanguage = (code: string) =>
    setLanguages((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));

  const onSave = async () => {
    setSaving(true);
    try {
      await savePrefs({
        data: {
          display_name: displayName || null,
          job_title: jobTitle || null,
          company: company || null,
          topics,
          languages: languages.length ? languages : ["en"],
          email_updates: emailUpdates,
          event_reminders: eventReminders,
          insights_digest: insightsDigest,
        },
      });
      toast.success("Preferences saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const addEmailChip = (raw: string) => {
    const candidates = raw
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!candidates.length) return;
    setEmailChips((prev) => {
      const next = [...prev];
      for (const c of candidates) {
        if (!EMAIL_RE.test(c)) {
          toast.error(`"${c}" is not a valid email`);
          continue;
        }
        if (next.includes(c)) continue;
        next.push(c);
      }
      return next;
    });
  };

  const removeEmailChip = (value: string) =>
    setEmailChips((prev) => prev.filter((e) => e !== value));

  const onEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " " || e.key === "Tab") {
      if (emailDraft.trim()) {
        e.preventDefault();
        addEmailChip(emailDraft);
        setEmailDraft("");
      }
    } else if (e.key === "Backspace" && !emailDraft && emailChips.length) {
      removeEmailChip(emailChips[emailChips.length - 1]);
    }
  };

  const onEmailPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (/[,;\s]/.test(text)) {
      e.preventDefault();
      addEmailChip(text);
      setEmailDraft("");
    }
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    let pending = [...emailChips];
    if (emailDraft.trim()) {
      const draft = emailDraft.trim().toLowerCase();
      if (EMAIL_RE.test(draft) && !pending.includes(draft)) pending.push(draft);
    }
    if (!pending.length) {
      toast.error("Add at least one email");
      return;
    }
    setInviting(true);
    let ok = 0;
    const failed: string[] = [];
    for (const em of pending) {
      try {
        await invite({ data: { email: em, role: "member" } });
        ok += 1;
      } catch {
        failed.push(em);
      }
    }
    setInviting(false);
    setEmailChips([]);
    setEmailDraft("");
    if (ok) toast.success(`Saved ${ok} ${ok === 1 ? "email" : "emails"} to your team`);
    if (failed.length) toast.error(`Failed: ${failed.join(", ")}`);
    const t = await fetchTeam();
    setTeam((t.team ?? []) as TeamRow[]);
  };

  const teamShareLink =
    typeof window !== "undefined" && ownerId
      ? `${window.location.origin}/join-team/${ownerId}`
      : "";

  const onCopyShareLink = async () => {
    if (!teamShareLink) return;
    try {
      await navigator.clipboard.writeText(teamShareLink);
      toast.success("Team invite link copied");
    } catch {
      toast.success(teamShareLink);
    }
  };

  const onRoleChange = async (id: string, role: "member" | "admin") => {
    const prev = team;
    setTeam((p) => p.map((m) => (m.id === id ? { ...m, role } : m)));
    try {
      await updateMember({ data: { id, role } });
      toast.success("Role updated");
    } catch (err) {
      setTeam(prev);
      toast.error(err instanceof Error ? err.message : "Could not update role");
    }
  };

  const onCopyInvite = async (id: string, token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied");
    } catch {
      toast.success(link);
    }
  };

  const onResendInvite = async (m: TeamRow) => {
    setResendingId(m.id);
    try {
      await invite({ data: { email: m.email, role: m.role } });
      if (teamShareLink) {
        try {
          await navigator.clipboard.writeText(teamShareLink);
          toast.success(`Invite refreshed for ${m.email} — team link copied`);
        } catch {
          toast.success(`Invite refreshed for ${m.email}`);
        }
      } else {
        toast.success(`Invite refreshed for ${m.email}`);
      }
      const t = await fetchTeam();
      setTeam((t.team ?? []) as TeamRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend invite");
    } finally {
      setResendingId(null);
    }
  };

  const onRemove = async (id: string) => {
    try {
      await removeMember({ data: { id } });
      setTeam((prev) => prev.filter((m) => m.id !== id));
      toast.success("Removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", search: { redirect: "/profile" } });
  };

  if (loading) {
    return <div className="px-5 py-10 text-sm text-muted-foreground">Loading your profile…</div>;
  }

  return (
    <div className="px-5 py-5 space-y-5 pb-24">
      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="text-muted-foreground">Signed in as</p>
            <p className="font-medium">{email ?? "—"}</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="display_name">Display name</Label>
              <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="job_title">Position / title</Label>
              <Input id="job_title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
        </CardContent>
      </Card>

      {/* Transformation interests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Transformation topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Pick the topics you want curated insights and event invites for.</p>
          <div className="flex flex-wrap gap-2">
            {TOPIC_OPTIONS.map((t) => {
              const on = topics.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTopic(t)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition ${
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">We'll prioritize content in these languages.</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((l) => {
              const on = languages.includes(l.code);
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => toggleLanguage(l.code)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition ${
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow label="Product & feature updates" checked={emailUpdates} onCheckedChange={setEmailUpdates} />
          <ToggleRow label="Event reminders" checked={eventReminders} onCheckedChange={setEventReminders} />
          <ToggleRow label="Weekly insights digest" checked={insightsDigest} onCheckedChange={setInsightsDigest} />
        </CardContent>
      </Card>

      <Button className="w-full" onClick={onSave} disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving…" : "Save preferences"}
      </Button>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Team members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Add teammate emails as chips, then save them all at once. They'll appear here with status <em>pending</em> until they sign in with the same email — or use the share link below to join in one click.
          </p>

          {/* Unique team share link */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <LinkIcon className="w-4 h-4 text-primary" aria-hidden /> Your team invite link
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={teamShareLink}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Team invite link"
                className="text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onCopyShareLink}
                disabled={!teamShareLink}
                aria-label="Copy team invite link"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Anyone with this link can sign in and be added to your team.
            </p>
          </div>

          <form onSubmit={onInvite} className="space-y-2">
            <Label htmlFor="team-emails" className="text-xs">Add by email</Label>
            <div
              className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 min-h-9 focus-within:ring-1 focus-within:ring-ring"
              onClick={() => document.getElementById("team-emails")?.focus()}
            >
              {emailChips.map((em) => (
                <span
                  key={em}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5"
                >
                  {em}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEmailChip(em);
                    }}
                    aria-label={`Remove ${em}`}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                id="team-emails"
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                onKeyDown={onEmailKeyDown}
                onPaste={onEmailPaste}
                onBlur={() => {
                  if (emailDraft.trim()) {
                    addEmailChip(emailDraft);
                    setEmailDraft("");
                  }
                }}
                placeholder={emailChips.length ? "" : "teammate@company.com, another@company.com"}
                className="flex-1 min-w-[160px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Press Enter, comma, or space to add an email. Backspace removes the last chip.
            </p>
            <Button type="submit" className="w-full" disabled={inviting}>
              <Mail className="w-4 h-4 mr-2" />
              {inviting ? "Sending…" : "Send invitations to my team"}
            </Button>
          </form>

          {team.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No teammates yet.</p>
          ) : (
            <ul className="space-y-2">
              {team.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.name || m.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge
                          variant={
                            m.status === "active"
                              ? "default"
                              : m.status === "pending"
                                ? "outline"
                                : "secondary"
                          }
                          className="text-[10px] capitalize"
                        >
                          {m.status}
                        </Badge>
                        {m.status === "pending" && (
                          <span className="text-[10px] text-muted-foreground">
                            Invited {new Date(m.invited_at).toLocaleDateString()}
                          </span>
                        )}
                        {m.status === "active" && m.accepted_at && (
                          <span className="text-[10px] text-muted-foreground">
                            Joined {new Date(m.accepted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(m.id)} aria-label="Remove">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={m.role}
                      onValueChange={(v) => onRoleChange(m.id, v as "member" | "admin")}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {m.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => onCopyInvite(m.id, m.invite_token)}
                      >
                        Copy invite link
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* App preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("bizzsurfer:open-welcome"));
              }
            }}
            aria-label="Reopen the welcome screen"
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" aria-hidden /> Show welcome screen
          </Button>
        </CardContent>
      </Card>

      {/* Gamification summary */}
      <GameSummary />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function GameSummary() {
  const game = useGame();
  const level = Math.floor(game.state.xp / 100) + 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Your progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={Zap} value={game.state.xp} label="XP" />
          <Stat icon={Flame} value={game.state.streak} label="Streak" />
          <Stat icon={MessageCircle} value={game.state.questionsAsked} label="Questions" />
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">Level {level}</p>
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Zap; value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto" />
      <p className="text-lg font-bold mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}
