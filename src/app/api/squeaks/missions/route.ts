import { ok, rpc, withUser } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// GET: active missions with this player's progress for the current period.
export const GET = withUser(async (_req, { userId }) => {
  return ok({ missions: await rpc("sq_missions_list", { p_user: userId }) });
});
