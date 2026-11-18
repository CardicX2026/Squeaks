import { randomUUID } from "node:crypto";
import { issue } from "@/lib/squeaks/ticket";
import { cheeseRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST: start a run. Returns a signed ticket the browser hands back when the run ends.
// body { game?: "chase" | "hammer" | "says" } (defaults to chase)
export const POST = cheeseRoute(async (req, userId) => {
  const b = await req.json().catch(() => ({}));
  const g = (b as { game?: string }).game;
  const game = g === "hammer" || g === "says" ? g : "chase";
  const run_id = randomUUID();
  return { run_id, ticket: issue({ k: "run", g: game, u: userId, rid: run_id, t: Date.now() }) };
});
