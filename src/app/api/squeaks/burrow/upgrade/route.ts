import { getConfig } from "@/lib/squeaks/config";
import { ok, rpc, withUser } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// POST: upgrade the burrow one level (pending cheese is paid out first).
export const POST = withUser(async (_req, { userId }) => {
  const cfg = await getConfig();
  const r = await rpc("sq_burrow_upgrade", {
    p_user: userId,
    p_base_cost: cfg.burrow_upgrade_base,
    p_base_per_hour: cfg.burrow_base_per_hour,
    p_max_hours: cfg.burrow_max_hours,
  });
  return ok(r);
});
