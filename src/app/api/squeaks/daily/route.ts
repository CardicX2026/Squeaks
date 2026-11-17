import { getConfig } from "@/lib/squeaks/config";
import { ok, rpc, withUser } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// POST: claim the daily reward and extend the streak.
export const POST = withUser(async (_req, { userId }) => {
  const cfg = await getConfig();
  return ok(await rpc("sq_daily_claim", {
    p_user: userId,
    p_base: cfg.daily_base_cheese,
    p_step: cfg.daily_streak_step,
    p_cap: cfg.daily_streak_cap,
    p_points: cfg.daily_points,
  }));
});
