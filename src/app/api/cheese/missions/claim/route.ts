import { credit, getLedger } from "@/lib/cardicx";
import { MISSIONS } from "@/lib/catalog";
import { BadRequest, body, cheeseRoute, utcDate } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST { missionId }: progress is checked against today's real CardicX ledger, never the browser.
export const POST = cheeseRoute(async (req, userId) => {
  const b = await body(req);
  const m = MISSIONS.find((x) => x.id === String(b.missionId || ""));
  if (!m) throw new BadRequest("mission_not_found");
  const day = utcDate();
  const { rows } = await getLedger(userId, 100);
  const mine = rows.filter((r) => r.source_type === "squeaks" && r.created_at.slice(0, 10) === day);
  const runs = mine.filter((r) => r.source_ref?.startsWith("run_"));
  const done =
    m.id === "runs3" ? runs.length >= 3 :
    m.id === "big200" ? runs.some((r) => r.delta >= 200) :
    m.id === "mine1" ? mine.some((r) => r.source_ref?.startsWith("mine_")) : false;
  if (!done) throw new BadRequest("mission_not_complete");
  return credit(userId, m.cheese, "mission", `mission_${m.id}_${userId}_${day}`);
});
