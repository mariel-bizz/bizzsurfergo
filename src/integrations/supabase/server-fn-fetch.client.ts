// Client-only fetch interceptor that attaches the current Supabase
// access token to every TanStack server-function request, so server fns
// guarded by `requireSupabaseAuth` can read the bearer token and act as
// the signed-in user.
//
// Without this, server fns called from the browser hit the auth
// middleware with no Authorization header and return 401, even when
// the user is signed in (token is in localStorage, not in the request).

import { supabase } from "./client";

const SERVER_FN_PREFIX = "/_serverFn/";

if (typeof window !== "undefined" && !(window as unknown as { __sbServerFnFetchPatched?: boolean }).__sbServerFnFetchPatched) {
  (window as unknown as { __sbServerFnFetchPatched?: boolean }).__sbServerFnFetchPatched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : input.url;

      const isServerFn =
        typeof url === "string" &&
        (url.includes(SERVER_FN_PREFIX) || url.startsWith(SERVER_FN_PREFIX));

      if (!isServerFn) return originalFetch(input, init);

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return originalFetch(input, init);

      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      if (!headers.has("authorization")) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return originalFetch(input, { ...init, headers });
    } catch {
      return originalFetch(input, init);
    }
  };
}

export {};
