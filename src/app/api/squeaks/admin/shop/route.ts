import { db } from "@/lib/squeaks/adapters";
import { ApiError, int, ok, readJson, str, withAdmin, audit } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// GET: every item, including inactive ones.
export const GET = withAdmin(async () => {
  const { data, error } = await db().from("sq_shop_items").select("*").order("sort");
  if (error) throw error;
  return ok({ items: data ?? [] });
});

// POST: create or update an item. To remove one, send active: false.
export const POST = withAdmin(async (req, { userId: admin }) => {
  const b = await readJson(req);
  const kind = str(b.kind, 1, 10, "kind");
  if (!["skin", "hat", "trail", "boost"].includes(kind)) throw new ApiError(400, "bad_kind");
  const item = {
    key: str(b.key, 1, 64, "key"),
    kind,
    name: str(b.name, 1, 80, "name"),
    description: typeof b.description === "string" ? b.description.slice(0, 300) : "",
    price_cheese: int(b.price_cheese, 0, 100_000_000, "price_cheese"),
    active: b.active === false ? false : true,
    sort: int(b.sort ?? 0, -10_000, 10_000, "sort"),
    meta: b.meta && typeof b.meta === "object" ? b.meta : {},
    available_from: typeof b.available_from === "string" ? b.available_from : null,
  };
  const { error } = await db().from("sq_shop_items").upsert(item, { onConflict: "key" });
  if (error) throw error;
  await audit(admin, "shop_upsert", item.key, item);
  return ok({ item });
});
