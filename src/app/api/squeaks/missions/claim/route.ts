import { ok, readJson, rpc, str, withUser } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// POST { mission_key }
export const POST = withUser(async (req, { userId }) => {
  const body = await readJson(req);
  const key = str(body.mission_key, 1, 64, "mission_key");
  return ok(await rpc("sq_mission_claim", { p_user: userId, p_key: key }));
});
