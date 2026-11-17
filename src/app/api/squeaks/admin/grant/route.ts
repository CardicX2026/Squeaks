import { ok, int, readJson, rpc, str, withAdmin, audit } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// POST { user_id, cheese, points, reason }   (negative numbers revoke)
export const POST = withAdmin(async (req, { userId: admin }) => {
  const body = await readJson(req);
  const target = str(body.user_id, 3, 200, "user_id");
  const cheese = int(body.cheese ?? 0, -1_000_000, 1_000_000, "cheese");
  const points = int(body.points ?? 0, -1_000_000, 1_000_000, "points");
  const reason = str(body.reason, 3, 300, "reason");
  const balances = await rpc("sq_apply", {
    p_user: target, p_cheese: cheese, p_points: points, p_reason: "admin", p_ref: "admin:" + crypto.randomUUID(),
  });
  await audit(admin, "grant", target, { cheese, points, reason });
  return ok({ balances });
});
