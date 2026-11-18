import { debit, type DebitReason } from "@/lib/cardicx";
import { item } from "@/lib/catalog";
import { BadRequest, body, cheeseRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST { itemId, orderId }: the price comes from the server catalog. Debit first; the item is granted only after a 200.
// One-time items use ref shop_<user>_<item>, so buying twice never charges twice. Boosters add the order id.
export const POST = cheeseRoute(async (req, userId) => {
  const b = await body(req);
  const it = item(String(b.itemId || ""));
  if (!it || it.price <= 0) throw new BadRequest("item_not_found");
  const consumable = it.cat === "Boosts";
  const orderId = String(b.orderId || "");
  if (consumable && !/^[a-z0-9-]{8,36}$/i.test(orderId)) throw new BadRequest("bad_order");
  const reason: DebitReason = it.cat === "Skins" ? "skin" : consumable ? "boost" : "shop_item";
  const ref = consumable ? `shop_${userId}_${it.id}_${orderId}` : `shop_${userId}_${it.id}`;
  const r = await debit(userId, it.price, reason, ref);
  return { ...r, item: it.id };
});
