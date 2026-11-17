import { db } from "@/lib/squeaks/adapters";
import { ok, withUser } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// GET: active items plus what this player owns.
export const GET = withUser(async (_req, { userId }) => {
  const now = new Date().toISOString();
  const { data: items } = await db().from("sq_shop_items")
    .select("key,kind,name,description,price_cheese,meta,sort,available_from")
    .eq("active", true).or(`available_from.is.null,available_from.lte.${now}`).order("sort");
  const { data: inv } = await db().from("sq_inventory").select("item_key,qty,equipped").eq("user_id", userId);
  return ok({ items: items ?? [], inventory: inv ?? [] });
});
