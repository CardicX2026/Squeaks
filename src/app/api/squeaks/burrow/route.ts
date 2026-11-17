import { db } from "@/lib/squeaks/adapters";
import { getConfig } from "@/lib/squeaks/config";
import { ok, withUser } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// GET: burrow state. "pending" is what you would collect right now.
export const GET = withUser(async (_req, { userId }) => {
  const cfg = await getConfig();
  const { data: b } = await db().from("sq_burrow").select("level,last_collect_at").eq("user_id", userId).single();
  const level = b?.level ?? 1;
  const last = b ? new Date(b.last_collect_at).getTime() : Date.now();
  const hours = Math.min((Date.now() - last) / 3_600_000, cfg.burrow_max_hours);
  const rate = cfg.burrow_base_per_hour * level;
  return ok({
    level,
    rate_per_hour: rate,
    max_hours: cfg.burrow_max_hours,
    pending: Math.floor(hours * rate),
    next_upgrade_cost: level >= 50 ? null : cfg.burrow_upgrade_base * level * level,
    last_collect_at: b?.last_collect_at ?? null,
  });
});
