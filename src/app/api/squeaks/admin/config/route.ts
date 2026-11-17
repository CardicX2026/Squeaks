import { db } from "@/lib/squeaks/adapters";
import { clearConfigCache, DEFAULTS, getConfig } from "@/lib/squeaks/config";
import { ApiError, ok, readJson, str, withAdmin, audit } from "@/lib/squeaks/http";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => ok({ config: await getConfig(), defaults: DEFAULTS }));

// PUT { key, value }: only known numeric keys. Takes up to 30 seconds to reach every server instance.
export const PUT = withAdmin(async (req, { userId: admin }) => {
  const b = await readJson(req);
  const key = str(b.key, 1, 64, "key");
  const value = Number(b.value);
  if (!(key in DEFAULTS)) throw new ApiError(400, "unknown_key");
  if (!Number.isFinite(value) || value < 0 || value > 1e9) throw new ApiError(400, "bad_value");
  const { error } = await db().from("sq_config").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
  clearConfigCache();
  await audit(admin, "config_set", key, { value });
  return ok({ key, value });
});
