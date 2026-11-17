import { db } from "@/lib/squeaks/adapters";
import { ApiError, int, ok, readJson, str, withAdmin, audit } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => {
  const { data, error } = await db().from("sq_missions").select("*").order("sort");
  if (error) throw error;
  return ok({ missions: data ?? [] });
});

// POST: create or update a mission. To retire one, send active: false.
export const POST = withAdmin(async (req, { userId: admin }) => {
  const b = await readJson(req);
  const metric = str(b.metric, 1, 10, "metric");
  const period = str(b.period, 1, 10, "period");
  if (!["runs", "score", "cheese"].includes(metric)) throw new ApiError(400, "bad_metric");
  if (!["daily", "weekly", "once"].includes(period)) throw new ApiError(400, "bad_period");
  const m = {
    key: str(b.key, 1, 64, "key"),
    title: str(b.title, 1, 80, "title"),
    description: typeof b.description === "string" ? b.description.slice(0, 300) : "",
    metric,
    target: int(b.target, 1, 100_000_000, "target"),
    reward_cheese: int(b.reward_cheese ?? 0, 0, 1_000_000, "reward_cheese"),
    reward_points: int(b.reward_points ?? 0, 0, 100_000, "reward_points"),
    period,
    active: b.active === false ? false : true,
    sort: int(b.sort ?? 0, -10_000, 10_000, "sort"),
  };
  const { error } = await db().from("sq_missions").upsert(m, { onConflict: "key" });
  if (error) throw error;
  await audit(admin, "mission_upsert", m.key, m);
  return ok({ mission: m });
});
