import { fail, ok, rpc } from "@/lib/squeaks/http";
import { startOfIsoWeekUtc, startOfUtcDay } from "@/lib/squeaks/time";

export const dynamic = "force-dynamic";

// GET ?period=daily|weekly|all&limit=50  (public)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "daily";
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 100);
    const since =
      period === "daily" ? startOfUtcDay().toISOString()
      : period === "weekly" ? startOfIsoWeekUtc().toISOString()
      : null;
    const rows = await rpc("sq_leaderboard", { p_since: since, p_limit: limit });
    return ok({ period, rows });
  } catch (e) {
    return fail(e);
  }
}
