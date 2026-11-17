import { ok, readJson, rpc, str, withUser } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// POST { item_key }
export const POST = withUser(async (req, { userId }) => {
  const body = await readJson(req);
  const item = str(body.item_key, 1, 64, "item_key");
  return ok(await rpc("sq_buy", { p_user: userId, p_item: item }));
});
