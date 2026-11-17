import { db } from "@/lib/squeaks/adapters";
import { ApiError, ok, readJson, str, withAdmin, audit } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// POST { user_id, banned: boolean, reason }
export const POST = withAdmin(async (req, { userId: admin }) => {
  const body = await readJson(req);
  const target = str(body.user_id, 3, 200, "user_id");
  if (typeof body.banned !== "boolean") throw new ApiError(400, "bad_banned");
  const reason = str(body.reason, 3, 300, "reason");
  const { error } = await db().from("sq_players")
    .update({ banned: body.banned, ban_reason: body.banned ? reason : null }).eq("user_id", target);
  if (error) throw error;
  await audit(admin, body.banned ? "ban" : "unban", target, { reason });
  return ok({ user_id: target, banned: body.banned });
});
