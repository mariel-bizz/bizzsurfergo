import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";

function randomState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/auth/linkedin/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        if (!clientId) {
          return new Response("LinkedIn not configured", { status: 500 });
        }
        const url = new URL(request.url);
        const redirectAfter = url.searchParams.get("redirect") || "/";
        const state = randomState();
        const callbackUrl = `${url.origin}/api/auth/linkedin/callback`;

        setCookie("li_oauth_state", state, {
          httpOnly: true,
          secure: url.protocol === "https:",
          sameSite: "lax",
          path: "/",
          maxAge: 600,
        });
        setCookie("li_oauth_redirect", redirectAfter, {
          httpOnly: true,
          secure: url.protocol === "https:",
          sameSite: "lax",
          path: "/",
          maxAge: 600,
        });

        const authorize = new URL("https://www.linkedin.com/oauth/v2/authorization");
        authorize.searchParams.set("response_type", "code");
        authorize.searchParams.set("client_id", clientId);
        authorize.searchParams.set("redirect_uri", callbackUrl);
        authorize.searchParams.set("scope", "openid profile email");
        authorize.searchParams.set("state", state);

        return new Response(null, {
          status: 302,
          headers: { Location: authorize.toString() },
        });
      },
    },
  },
});
