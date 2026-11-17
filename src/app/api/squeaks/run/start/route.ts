import { db } from "@/lib/squeaks/adapters";
import { getConfig } from "@/lib/squeaks/config";
import { ApiError, ok, withUser } from "@/lib/squeaks/http";
import { startOfUtcDay } from "@/lib/squeaks/time";

export const dynamic = "force-dynamic";

// POST: start a run. Returns { run_id, seed }. One active run per player at a time.
export const POST = withUser(async (_req, { userId }) => {
  const cfg = await getConfig();

  const { data: last } = await db().from("sq_runs").select("started_at")
    .eq("user_id", userId).order("started_at", { ascending: false }).limit(1);
  if (last?.[0] && Date.now() - new Date(last[0].started_at).getTime() < cfg.run_start_cooldown_ms) {
    throw new ApiError(429, "too_fast");
  }

  const { count } = await db().from("sq_runs").select("id", { count: "exact", head: true })
    .eq("user_id", userId).gte("started_at", startOfUtcDay().toISOString());
  if ((count ?? 0) >= cfg.max_runs_per_day) throw new ApiError(429, "daily_run_limit");

  // Any earlier run still marked active is abandoned.
  await db().from("sq_runs").update({ status: "expired" }).eq("user_id", userId).eq("status", "active");

  const { data, error } = await db().from("sq_runs")
    .insert({ user_id: userId, seed: crypto.randomUUID() })
    .select("id,seed,started_at").single();
  if (error) throw error;
  return ok({ run_id: data.id, seed: data.seed, started_at: data.started_at });
});
