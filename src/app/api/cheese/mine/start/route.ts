import { issue } from "@/lib/squeaks/ticket";
import { cheeseRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const mineShiftMs = () => (Number(process.env.SQ_MINE_SHIFT_SECONDS) || 24 * 3600) * 1000;

// POST: start a Mine shift. The start time lives inside a signed ticket, so the browser clock cannot cheat.
export const POST = cheeseRoute(async (_req, userId) => {
  const start = Date.now();
  return { ticket: issue({ k: "mine", u: userId, t: start, lvl: 1 }), start, shiftMs: mineShiftMs() };
});
