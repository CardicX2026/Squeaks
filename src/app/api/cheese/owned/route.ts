import { getLedger } from "@/lib/cardicx";
import { ITEMS } from "@/lib/catalog";
import { cheeseRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: one-time items the player has bought, recovered from CardicX purchase refs (best effort, recent history).
export const GET = cheeseRoute(async (_req, userId) => {
  const { rows } = await getLedger(userId, 100);
  const prefix = `shop_${userId}_`;
  const owned = new Set<string>();
  for (const r of rows) {
    if (!r.source_ref?.startsWith(prefix)) continue;
    const id = r.source_ref.slice(prefix.length);
    if (ITEMS.some((i) => i.id === id && i.cat !== "Boosts")) owned.add(id);
  }
  return { owned: [...owned] };
});
