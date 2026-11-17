import { db } from "@/lib/squeaks/adapters";
import { fail, ok, readJson, str, withUser, ApiError } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

// GET: the signed-in player's profile, balances and equipped items.
export const GET = withUser(async (_req, { userId, player }) => {
  const { data: inv } = await db()
    .from("sq_inventory").select("item_key,qty,equipped").eq("user_id", userId);
  return ok({
    handle: player.handle,
    cheese: player.cheese,
    points: player.points,
    best_score: player.best_score,
    runs: player.runs,
    streak: player.streak,
    can_claim_daily: player.last_daily !== new Date().toISOString().slice(0, 10),
    inventory: inv ?? [],
  });
});

// PATCH { handle }: 3 to 20 characters, a-z 0-9 underscore.
export const PATCH = withUser(async (req, { userId }) => {
  try {
    const body = await readJson(req);
    const handle = str(body.handle, 3, 20, "handle").toLowerCase();
    if (!/^[a-z0-9_]+$/.test(handle)) throw new ApiError(400, "bad_handle");
    const { error } = await db().from("sq_players").update({ handle }).eq("user_id", userId);
    if (error) {
      if (error.code === "23505") throw new ApiError(409, "handle_taken");
      throw error;
    }
    return ok({ handle });
  } catch (e) {
    return fail(e);
  }
});
