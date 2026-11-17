import { db } from "@/lib/squeaks/adapters";
import { checkRun } from "@/lib/squeaks/anticheat";
import { getConfig } from "@/lib/squeaks/config";
import { ApiError, int, ok, readJson, rpc, str, withUser } from "@/lib/squeaks/http";
import { startOfUtcDay } from "@/lib/squeaks/time";

export const dynamic = "force-dynamic";

// POST { run_id, score, cheese }: finish a run. The server decides what is paid.
export const POST = withUser(async (req, { userId }) => {
  const cfg = await getConfig();
  const body = await readJson(req);
  const runId = str(body.run_id, 36, 36, "run_id");
  const score = int(body.score, 0, 10_000_000, "score");
  const cheese = int(body.cheese, 0, 1_000_000, "cheese");

  const { data: run } = await db().from("sq_runs").select("id,status,started_at")
    .eq("id", runId).eq("user_id", userId).maybeSingle();
  if (!run) throw new ApiError(404, "run_not_found");
  if (run.status !== "active") throw new ApiError(409, "run_not_active");

  const elapsed = Date.now() - new Date(run.started_at).getTime();
  const verdict = checkRun(elapsed, score, cheese, cfg);

  if (!verdict.ok) {
    const { data: upd } = await db().from("sq_runs")
      .update({ status: "rejected", reject_reason: verdict.reason, finished_at: new Date().toISOString(), duration_ms: Math.round(elapsed), score, cheese })
      .eq("id", runId).eq("status", "active").select("id");
    if (upd?.length) {
      await db().from("sq_flags").insert({ user_id: userId, run_id: runId, reason: verdict.reason });
    }
    throw new ApiError(422, "run_rejected", verdict.reason);
  }

  const paidCheese = Math.min(cheese, cfg.cheese_per_run_cap);

  // Points: from score, capped per UTC day.
  const { data: today } = await db().from("sq_ledger").select("delta")
    .eq("user_id", userId).eq("kind", "points").eq("reason", "run")
    .gte("created_at", startOfUtcDay().toISOString());
  const earnedToday = (today ?? []).reduce((a, r) => a + Number(r.delta), 0);
  const room = Math.max(0, cfg.daily_points_cap - earnedToday);
  const paidPoints = Math.min(Math.floor((score / 100) * cfg.points_per_100_score), room);

  // Claim the run first. Only one request can flip active -> finished.
  const { data: claimed } = await db().from("sq_runs")
    .update({ status: "finished", finished_at: new Date().toISOString(), duration_ms: Math.round(elapsed), score, cheese: paidCheese })
    .eq("id", runId).eq("status", "active").select("id");
  if (!claimed?.length) throw new ApiError(409, "run_not_active");

  const balances = await rpc("sq_apply", {
    p_user: userId, p_cheese: paidCheese, p_points: paidPoints, p_reason: "run", p_ref: runId,
  });
  const best = await rpc<number>("sq_record_run", { p_user: userId, p_score: score });
  await rpc("sq_bump", { p_user: userId, p_metric: "runs", p_amount: 1, p_mode: "add" });
  await rpc("sq_bump", { p_user: userId, p_metric: "score", p_amount: score, p_mode: "max" });
  if (paidCheese > 0) await rpc("sq_bump", { p_user: userId, p_metric: "cheese", p_amount: paidCheese, p_mode: "add" });

  return ok({ score, cheese: paidCheese, points: paidPoints, best_score: best, balances });
});
