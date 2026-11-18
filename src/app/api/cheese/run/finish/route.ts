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
  const t = verify<{ k: string; g?: string; u: string; rid: string; t: number }>(b.ticket);
  if (!t || t.k !== "run" || t.u !== userId) throw new BadRequest("bad_ticket");
  const game = t.g ?? "chase";
  const ms = Date.now() - t.t, secs = ms / 1000;
  const score = Math.floor(Number(b.score)), cheese = Math.floor(Number(b.cheese ?? 0));
  if (!Number.isFinite(score) || !Number.isFinite(cheese) || score < 0 || cheese < 0) throw new BadRequest("bad_values");
  let amount = 0;
  if (game === "hammer") {
    // 45s rounds; points per hit x combo; never trust the browser's Cheese
    if (ms < 40_000 || ms > 70_000 || score > secs * 150) throw new BadRequest("implausible_run");
    amount = Math.min(150, Math.floor(score / 25));
  } else if (game === "says") {
    // score = rounds cleared; round i shows i notes, so a real game needs at least ~0.35s x i(i+1)
    if (score > 60 || ms < 2_000 || ms < score * (score + 1) * 350 || ms > 60 * 60_000) throw new BadRequest("implausible_run");
    amount = Math.min(150, score * 6);
  } else {
    if (ms < MIN_MS || ms > MAX_MS) throw new BadRequest("run_time_invalid");
    if (score > secs * MAX_SCORE_PER_SEC + 600 || cheese > secs * MAX_CHEESE_PER_SEC + 5) throw new BadRequest("implausible_run");
    amount = Math.min(RUN_CHEESE_CAP, cheese);
  }
  // verified Cheese Chase scores go to the CardicX leaderboard (best effort: never blocks the Cheese)
  const score_saved = game === "chase" ? await postScore(userId, score, `run_${t.rid}`).then(() => true).catch(() => false) : false;
  if (amount <= 0) return { credited: 0, capped: false, balance: null, score_saved };
  return { ...(await credit(userId, amount, "game_run", `run_${t.rid}`)), score_saved };
});
