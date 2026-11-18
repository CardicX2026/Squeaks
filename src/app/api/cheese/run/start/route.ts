import { randomUUID } from "node:crypto";
import { issue } from "@/lib/squeaks/ticket";
import { cheeseRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST: start a run. Returns a signed ticket the browser hands back when the run ends.
export const POST = cheeseRoute(async (_req, userId) => {
  const run_id = randomUUID();
  return { run_id, ticket: issue({ k: "run", u: userId, rid: run_id, t: Date.now() }) };
});
