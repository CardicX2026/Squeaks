import { getProfile, setProfile } from "@/lib/cardicx";
import { item } from "@/lib/catalog";
import { BadRequest, body, cheeseRoute } from "@/lib/squeaks/cheese-route";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = cheeseRoute(async (_req, userId) => getProfile(userId));

// POST { handle?, skin? }: handle is 3-20 of a-z 0-9 _ (unique on CardicX); skin must be a known skin id
export const POST = cheeseRoute(async (req, userId) => {
  const b = await body(req);
  const patch: { handle?: string; skin?: string } = {};
  if (b.handle !== undefined) {
    const h = String(b.handle).toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(h)) throw new BadRequest("bad_handle");
    patch.handle = h;
  }
  if (b.skin !== undefined) {
    const it = item(String(b.skin));
    if (!it || it.cat !== "Skins") throw new BadRequest("bad_skin");
    patch.skin = it.id;
  }
  return setProfile(userId, patch);
});
