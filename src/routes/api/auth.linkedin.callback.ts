import { createFileRoute } from "@tanstack/react-router";
import { getCookie, deleteCookie } from "@tanstack/react-start/server";

interface LinkedInUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

function errorRedirect(origin: string, message: string) {
  const u = new URL("/login", origin);
  u.searchParams.set("error", message);
  return new Response(null, { status: 302, headers: { Location: u.toString() } });
}

export const Route = createFileRoute("/api/auth/linkedin/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const providerError = url.searchParams.get("error");

        if (providerError) {
          return errorRedirect(origin, providerError);
        }
        if (!code || !state) {
          return errorRedirect(origin, "Missing code or state");
        }

        const cookieState = getCookie("li_oauth_state");
        const redirectAfter = getCookie("li_oauth_redirect") || "/";
        deleteCookie("li_oauth_state", { path: "/" });
        deleteCookie("li_oauth_redirect", { path: "/" });

        if (!cookieState || cookieState !== state) {
          return errorRedirect(origin, "Invalid OAuth state");
        }

        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          return errorRedirect(origin, "LinkedIn not configured");
        }

        const callbackUrl = `${origin}/api/auth/linkedin/callback`;

        // 1. Exchange code for access token
        const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: callbackUrl,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
        if (!tokenRes.ok) {
          const t = await tokenRes.text();
          console.error("LinkedIn token exchange failed:", tokenRes.status, t);
          return errorRedirect(origin, "LinkedIn token exchange failed");
        }
        const tokenJson = (await tokenRes.json()) as { access_token?: string };
        if (!tokenJson.access_token) {
          return errorRedirect(origin, "LinkedIn returned no access token");
        }

        // 2. Fetch userinfo
        const uiRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenJson.access_token}` },
        });
        if (!uiRes.ok) {
          const t = await uiRes.text();
          console.error("LinkedIn userinfo failed:", uiRes.status, t);
          return errorRedirect(origin, "Could not fetch LinkedIn profile");
        }
        const info = (await uiRes.json()) as LinkedInUserInfo;
        if (!info.email) {
          return errorRedirect(origin, "LinkedIn account has no email");
        }

        // 3. Find or create the Supabase user
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const userMeta = {
          full_name: info.name,
          name: info.name,
          given_name: info.given_name,
          family_name: info.family_name,
          avatar_url: info.picture,
          picture: info.picture,
          locale: info.locale,
          provider: "linkedin",
          linkedin_sub: info.sub,
        };

        // Look up by email
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (listErr) {
          console.error("listUsers failed:", listErr);
          return errorRedirect(origin, "Auth lookup failed");
        }
        const emailLower = info.email.toLowerCase();
        const existing = list.users.find(
          (u) => (u.email || "").toLowerCase() === emailLower,
        );

        if (!existing) {
          const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: info.email,
            email_confirm: true,
            user_metadata: userMeta,
          });
          if (createErr) {
            console.error("createUser failed:", createErr);
            return errorRedirect(origin, "Could not create account");
          }
        } else {
          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            user_metadata: { ...(existing.user_metadata || {}), ...userMeta },
          });
        }

        // 4. Generate a magic link the browser can follow to establish a session
        const safeRedirect =
          redirectAfter.startsWith("/") && !redirectAfter.startsWith("//")
            ? `${origin}${redirectAfter}`
            : origin;

        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: info.email,
          options: { redirectTo: safeRedirect },
        });
        if (linkErr || !linkData?.properties?.action_link) {
          console.error("generateLink failed:", linkErr);
          return errorRedirect(origin, "Could not start session");
        }

        return new Response(null, {
          status: 302,
          headers: { Location: linkData.properties.action_link },
        });
      },
    },
  },
});
