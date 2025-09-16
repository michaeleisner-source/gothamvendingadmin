// Deno / Edge Function shared guard
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url  = Deno.env.get("SUPABASE_URL")!;
const key  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEMO = Deno.env.get("DEMO_MODE") === "1";

const admin = createClient(url, key);

const baseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store",
  // CORS (adjust origin allowlist as you like)
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: baseHeaders });
}

export async function getUserFromAuth(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  try {
    const { data } = await admin.auth.getUser(jwt);
    return data?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Wrap a handler: if user is missing
 *  - in DEMO → allow handler to return mock/redacted
 *  - otherwise → 401
 */
export function withAuthOrDemo<T>(
  handler: (ctx: { req: Request; user: any | null; demo: boolean }) => Promise<Response>,
  opts: { allowDemo: boolean }
) {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return json({ ok: true }); // CORS preflight
    const user = await getUserFromAuth(req);
    if (!user) {
      if (DEMO && opts.allowDemo) {
        return handler({ req, user: null, demo: true });
      }
      return json({ error: "Unauthorized" }, 401);
    }
    return handler({ req, user, demo: false });
  };
}

/** Utilities to mask sensitive fields */
export const redact = {
  email: (e: string) => e.replace(/(.{2}).*(@.*)/, "$1***$2"),
  phone: (p: string) => p.replace(/(\d{2})\d+(\d{2})$/, "$1***$2"),
  name:  (n: string) => n ? n[0] + "****" : "",
};

// Export the admin client for direct use when needed
export { admin };