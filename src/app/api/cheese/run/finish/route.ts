import { credit, postScore } from "@/lib/cardicx";
import { RUN_CHEESE_CAP } from "@/lib/catalog";
import { verify } from "@/lib/squeaks/ticket";
import { BadRequest, body, cheeseRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SCORE_PER_SEC = 120, MAX_CHEESE_PER_SEC = 6, MIN_MS = 5_000, MAX_MS = 30 * 60_000;

// POST { ticket, score, cheese }: the server checks the run and decides the Cheese, then credits CardicX once (ref run_<id>).
export const POST = cheeseRoute(async (req, userId) => {
  const b = await body(req);
  const t = verify<{ k: string; u: string; rid: string; t: number }>(b.ticket);
  if (!t || t.k !== "run" || t.u !== userId) throw new BadRequest("bad_ticket");
  const ms = Date.now() - t.t;
  if (ms < MIN_MS || ms > MAX_MS) throw new BadRequest("run_time_invalid");
  const score = Math.floor(Number(b.score)), cheese = Math.floor(Number(b.cheese));
  if (!Number.isFinite(score) || !Number.isFinite(cheese) || score < 0 || cheese < 0) throw new BadRequest("bad_values");
  const secs = ms / 1000;
  if (score > secs * MAX_SCORE_PER_SEC + 600 || cheese > secs * MAX_CHEESE_PER_SEC + 5) throw new BadRequest("implausible_run");
  // verified score goes to the CardicX leaderboard (best effort: never blocks the Cheese)
  const score_saved = await postScore(userId, score, `run_${t.rid}`).then(() => true).catch(() => false);
  const amount = Math.min(RUN_CHEESE_CAP, cheese);
  if (amount <= 0) return { credited: 0, capped: false, balance: null, score_saved };
  return { ...(await credit(userId, amount, "game_run", `run_${t.rid}`)), score_saved };
});
