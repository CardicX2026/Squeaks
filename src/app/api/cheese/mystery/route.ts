import { NextResponse } from "next/server";
import { verify } from "@/lib/squeaks/ticket";
import { BadRequest, body, cheeseRoute } from "@/lib/squeaks/cheese-route";
import { isPass, passForRun } from "@/lib/squeaks/pass";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST { ticket }: a signed-in player who found the mystery box in a Cheese Chase run gets that run's
// CardicX free-access pass code. One code per run, and the run must have lasted long enough to reach the box.
export const POST = cheeseRoute(async (req, userId) => {
  const b = await body(req);
  const t = verify<{ k: string; g?: string; u: string; rid: string; t: number }>(b.ticket);
  if (!t || t.k !== "run" || t.u !== userId || (t.g ?? "chase") !== "chase") throw new BadRequest("bad_ticket");
  const ms = Date.now() - t.t;
  if (ms < 8_000 || ms > 3 * 3600_000) throw new BadRequest("run_time_invalid");
  return { code: passForRun(t.rid) };
});

/** For CardicX support: is this pass code real? (It cannot tell whether it was already redeemed.) */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (code.length > 40) return NextResponse.json({ valid: false });
  try { return NextResponse.json({ valid: isPass(code) }); } catch { return NextResponse.json({ error: "unavailable" }, { status: 503 }); }
}
