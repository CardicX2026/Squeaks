import { db } from "@/lib/squeaks/adapters";
import { ok, withAdmin } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// GET ?q=handle-or-did&limit=50
export const GET = withAdmin(async (req) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 100);
  const cols = "user_id,handle,cheese,points,best_score,runs,streak,banned,ban_reason,created_at";
  let query = db().from("sq_players").select(cols).order("created_at", { ascending: false }).limit(limit);
  if (q.startsWith("did:")) query = query.eq("user_id", q);
  else if (q) query = query.ilike("handle", `%${q.replace(/[%_,]/g, "")}%`);
  const { data, error } = await query;
  if (error) throw error;
  return ok({ players: data ?? [] });
});
