import { getLeaderboard } from "@/lib/cardicx";
import { publicRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET ?period=daily|weekly|all  (public; best single verified run per player, stored on CardicX)
export const GET = publicRoute(async (req) => {
  const p = new URL(req.url).searchParams.get("period");
  const period = p === "weekly" || p === "all" ? p : "daily";
  return getLeaderboard(period, 50);
});
