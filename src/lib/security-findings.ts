/**
 * Curated registry of every security scan finding that has been reviewed,
 * with current status and remediation notes. Surfaced in /admin/security.
 *
 * When a new scanner finding appears, add an entry here so the admin page
 * stays an accurate single source of truth.
 */

export type FindingStatus = "fixed" | "intentional" | "manual_action" | "open";
export type FindingSeverity = "info" | "warn" | "critical";

export interface SecurityFinding {
  id: string;
  name: string;
  severity: FindingSeverity;
  source: "supabase_lov" | "supabase" | "connector_security_scan" | "trust_surface" | "manual";
  status: FindingStatus;
  /** Short note explaining current state. */
  note: string;
  /** Optional link to docs or remediation. */
  link?: string;
}

export const SECURITY_FINDINGS: SecurityFinding[] = [
  {
    id: "user_notifications_missing_insert",
    name: "user_notifications missing INSERT policy",
    severity: "warn",
    source: "supabase_lov",
    status: "fixed",
    note: "Added 'Users insert own notifications' policy scoped to auth.uid() = user_id.",
  },
  {
    id: "function_search_path_mutable",
    name: "Email queue helpers had mutable search_path",
    severity: "warn",
    source: "supabase",
    status: "fixed",
    note: "ALTER FUNCTION ... SET search_path = pgmq, public applied to enqueue_email, read_email_batch, move_to_dlq, delete_email.",
  },
  {
    id: "auth_otp_long_expiry",
    name: "Auth OTP expiry exceeds recommended threshold",
    severity: "warn",
    source: "supabase",
    status: "manual_action",
    note: "Lower Email OTP expiry to ≤ 1 hour (3600 s) in Cloud → Users → Auth Settings. Cannot be set from migrations.",
    link: "https://supabase.com/docs/guides/platform/going-into-prod#security",
  },
  {
    id: "rls_policy_always_true",
    name: "Permissive RLS policies (USING true)",
    severity: "info",
    source: "supabase_lov",
    status: "intentional",
    note: "Public-capture surfaces (outbound_clicks INSERT, waitlist INSERT, marketplace_inquiries INSERT) and public-read surfaces (insights_likes/comments, team_members token-gated, event_meet_links auth-only) are intentional. SELECT/UPDATE/DELETE remain locked. Tagged with -- lovable:allow-open-rls.",
  },
  {
    id: "anon_security_definer_executable",
    name: "Public/authenticated EXECUTE on SECURITY DEFINER functions",
    severity: "info",
    source: "supabase_lov",
    status: "intentional",
    note: "public.has_role is intentionally callable by authenticated for RLS gating; BYOK/vault RPCs are SECURITY DEFINER but scope all access by auth.uid() ownership and never return secret material.",
  },
];

export function summarize(findings: SecurityFinding[]) {
  return {
    total: findings.length,
    fixed: findings.filter((f) => f.status === "fixed").length,
    intentional: findings.filter((f) => f.status === "intentional").length,
    manual: findings.filter((f) => f.status === "manual_action").length,
    open: findings.filter((f) => f.status === "open").length,
  };
}
