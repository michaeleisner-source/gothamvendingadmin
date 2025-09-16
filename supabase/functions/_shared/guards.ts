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
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: baseHeaders });
}

export async function getUserFromAuth(req: Request) {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  try { return (await admin.auth.getUser(jwt)).data?.user ?? null; }
  catch { return null; }
}

/** Wrap a handler: in demo (no JWT), allow a safe response; otherwise require auth. */
export function withAuthOrDemo(
  handler: (ctx: { req: Request; user: any|null; demo: boolean }) => Promise<Response>,
  opts: { allowDemo: boolean }
) {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return json({ ok: true });
    const user = await getUserFromAuth(req);
    if (!user) {
      if (DEMO && opts.allowDemo) return handler({ req, user: null, demo: true });
      return json({ error: "Unauthorized" }, 401);
    }
    return handler({ req, user, demo: false });
  };
}

/* ---------- Redaction helpers ---------- */
export function redactFinancialRow<T extends Record<string, unknown>>(row: T): T {
  const r = { ...row };
  // hide cost/profit metrics in anon/demo
  for (const k of ["cogs","profit","profit_pct","margin","unit_cost"]) {
    if (k in r) (r as any)[k] = null;
  }
  return r;
}

export function maskId(s: string) {
  if (!s) return s;
  // keep prefix, mask middle
  return s.replace(/(.{2}).*(.{2})$/, "$1•••$2");
}

export function scrubContacts<T extends Record<string, unknown>>(row: T): T {
  const r = { ...row };
  if ("email" in r && typeof r.email === "string") (r as any).email = (r.email as string).replace(/(.{2}).*(@.*)/, "$1***$2");
  if ("phone" in r && typeof r.phone === "string") (r as any).phone = (r.phone as string).replace(/(\d{2})\d+(\d{2})$/, "$1***$2");
  if ("name"  in r && typeof r.name  === "string") (r as any).name  = (r.name  as string).slice(0,1) + "****";
  if ("machine_id" in r && typeof r.machine_id === "string") (r as any).machine_id = maskId(String(r.machine_id));
  return r;
}

// Export the admin client for direct use when needed
export { admin };