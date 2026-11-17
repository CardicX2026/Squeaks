// The only file that knows how to reach Supabase and Privy.
// If your project already has helpers (supabaseAdmin, getPrivyUserId), swap the bodies below to use them.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrivyClient } from "@privy-io/server-auth";

let _db: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (_db) return _db;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  _db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _db;
}

let _privy: PrivyClient | null = null;
/** Returns the Privy user id (DID) for the Bearer token, or null. */
export async function getUserId(req: Request): Promise<string | null> {
  const h = req.headers.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return null;
  try {
    if (!_privy) {
      const id = process.env.NEXT_PUBLIC_PRIVY_APP_ID || process.env.PRIVY_APP_ID;
      const secret = process.env.PRIVY_APP_SECRET;
      if (!id || !secret) throw new Error("Missing Privy env");
      _privy = new PrivyClient(id, secret);
    }
    const claims = await _privy.verifyAuthToken(token);
    return claims.userId;
  } catch {
    return null;
  }
}
