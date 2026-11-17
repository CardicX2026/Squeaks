import { ApiError, ok, readJson, rpc, str, withUser } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// POST { item_key, equipped: boolean }
export const POST = withUser(async (req, { userId }) => {
  const body = await readJson(req);
  const item = str(body.item_key, 1, 64, "item_key");
  if (typeof body.equipped !== "boolean") throw new ApiError(400, "bad_equipped");
  await rpc("sq_equip", { p_user: userId, p_item: item, p_equipped: body.equipped });
  return ok({ item_key: item, equipped: body.equipped });
});
