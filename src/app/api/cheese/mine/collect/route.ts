import { credit } from "@/lib/cardicx";
import { mineYield } from "@/lib/catalog";
import { verify } from "@/lib/squeaks/ticket";
import { BadRequest, body, cheeseRoute, utcDate } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const shiftMs = () => (Number(process.env.SQ_MINE_SHIFT_SECONDS) || 24 * 3600) * 1000;

// POST { ticket }: pays a finished shift once per user per UTC day (ref mine_<user>_<date>).
export const POST = cheeseRoute(async (req, userId) => {
  const t = verify<{ k: string; u: string; t: number; lvl: number }>((await body(req)).ticket);
  if (!t || t.k !== "mine" || t.u !== userId) throw new BadRequest("bad_ticket");
  if (Date.now() - t.t < shiftMs()) throw new BadRequest("not_ready");
  return credit(userId, mineYield(1), "mine", `mine_${userId}_${utcDate()}`);
});
